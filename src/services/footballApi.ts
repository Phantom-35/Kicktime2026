/**
 * Live scores service — Supabase Edge Function proxy.
 *
 * The static FIFA 2026 schedule lives in `src/data/world_cup_2026_schedule.json`
 * and is seeded into the match store. This service ONLY streams live scores
 * and merges them into existing fixtures via the team-mapping layer.
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useMatchStore } from "@/store/match-store";
import { apiNameToCode } from "@/utils/teamMapping";
import { getTeam } from "@/data/teams";

export type LiveFixture = {
  teamA: string;
  teamB: string;
  status: "scheduled" | "live" | "finished";
  liveScore?: { a: number; b: number };
  matchMinute?: number;
  utcTimestamp?: string;
  stadium?: string;
  city?: string;
  /** OpenLigaDB matchID – Fallback-Matcher, wenn Team-Namen leer sind. */
  matchId?: string;
};

export type FetchMode = "idle" | "live";

type RawFixture = {
  fixture?: {
    id?: string | number;
    date?: string;
    status?: { short?: string; elapsed?: number | null };
    venue?: { name?: string | null; city?: string | null };
  };
  teams?: { home?: { name?: string }; away?: { name?: string } };
  goals?: { home?: number | null; away?: number | null };
};

export function isLiveDataEnabled(): boolean {
  return isSupabaseConfigured();
}

export type LiveFetchResult = {
  fixtures: LiveFixture[];
  url: string | null;
  koPhase: number | null;
  error?: string;
};

export async function fetchLiveWorldCupData(
  mode: FetchMode = "live",
  koPhase: number | null = null,
  force = false,
): Promise<LiveFetchResult> {
  if (!isLiveDataEnabled()) return { fixtures: [], url: null, koPhase };

  try {
    const { data, error } = await supabase.functions.invoke<{
      fixtures?: RawFixture[];
      error?: string;
      cache?: "hit" | "miss" | "stale" | "overrides";
      url?: string;
      koPhase?: number | null;
    }>("fetch-live-scores", { body: { mode, koPhase, force } });

    if (error) {
      console.warn("[footballApi] edge function error", error.message);
      return { fixtures: [], url: null, koPhase, error: error.message };
    }
    if (data?.error) {
      console.warn("[footballApi] edge function returned error", data.error);
      return {
        fixtures: normalize(data?.fixtures ?? []),
        url: data?.url ?? null,
        koPhase: data?.koPhase ?? koPhase,
        error: data.error,
      };
    }
    return {
      fixtures: normalize(data?.fixtures ?? []),
      url: data?.url ?? null,
      koPhase: data?.koPhase ?? koPhase,
    };
  } catch (err) {
    console.warn("[footballApi] invoke failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { fixtures: [], url: null, koPhase, error: msg };
  }
}

/**
 * Force-Fetch der aktiven Phase — umgeht den 5-Min-Cache in der Edge Function
 * und zieht die Route sofort frisch. Anschließend sollte
 * `fetchAllStoredFixtures()` aufgerufen werden, um den kompletten Store zu
 * rehydraten.
 */
export async function forceFetchActivePhase(
  koPhase: number | null,
): Promise<LiveFetchResult> {
  return fetchLiveWorldCupData("live", koPhase, true);
}

/**
 * Liest den kompletten persistenten Store (`match_results`) über die Edge
 * Function. Verlustfrei — enthält Gruppenphase + alle KO-Phasen zusammen.
 */
export async function fetchAllStoredFixtures(): Promise<LiveFixture[]> {
  if (!isLiveDataEnabled()) return [];
  try {
    const { data, error } = await supabase.functions.invoke<{
      fixtures?: RawFixture[];
    }>("fetch-live-scores", { body: { mode: "full-store" } });
    if (error) {
      console.warn("[footballApi] full-store error", error.message);
      return [];
    }
    return normalize(data?.fixtures ?? []);
  } catch (err) {
    console.warn("[footballApi] full-store invoke failed", err);
    return [];
  }
}

/**
 * Triggert einen manuellen Sync der Gruppenphase (wm2026/2026) in die
 * persistente `match_results`-Tabelle. Nutzt keinen Cache.
 */
export async function syncGroupPhase(): Promise<{ synced: number; error?: string }> {
  if (!isLiveDataEnabled()) return { synced: 0, error: "Backend nicht konfiguriert" };
  try {
    const { data, error } = await supabase.functions.invoke<{
      synced?: number;
      error?: string;
    }>("fetch-live-scores", { body: { mode: "sync-groups" } });
    if (error) return { synced: 0, error: error.message };
    if (data?.error) return { synced: data.synced ?? 0, error: data.error };
    return { synced: data?.synced ?? 0 };
  } catch (err) {
    return { synced: 0, error: err instanceof Error ? err.message : String(err) };
  }
}


function normalize(raw: RawFixture[]): LiveFixture[] {
  const out: LiveFixture[] = [];
  const now = Date.now();
  for (const r of raw) {
    const homeName = r.teams?.home?.name;
    const awayName = r.teams?.away?.name;
    const teamA = apiNameToCode(homeName);
    const teamB = apiNameToCode(awayName);
    const matchId =
      r.fixture?.id != null ? String(r.fixture.id) : undefined;

    // Zeilen ohne Team-Zuordnung DÜRFEN NICHT verworfen werden — wir versuchen
    // sie später über die matchId zu paaren (KO-Slots mit Placeholder-Namen).
    if (!teamA || !teamB) {
      if (!matchId) continue;
    }

    const isoDate = r.fixture?.date;
    const kickoff = isoDate ? new Date(isoDate).getTime() : NaN;
    const rawStatus = mapStatus(r.fixture?.status?.short ?? "NS");

    // ZEIT-HARTE Status-Korrektur: Wenn der Anpfiff noch in der Zukunft liegt,
    // ist das Spiel definitiv nicht "live" oder "finished" — egal was die API
    // sagt. Verhindert den Zombie-State "finished ohne Score" für zukünftige
    // Spiele, der zu "Ergebnis wird geladen…" führt.
    let status = rawStatus;
    let liveScore: LiveFixture["liveScore"] =
      r.goals?.home != null && r.goals?.away != null
        ? { a: r.goals.home, b: r.goals.away }
        : undefined;
    if (!Number.isNaN(kickoff) && kickoff > now) {
      status = "scheduled";
      liveScore = undefined;
    }

    out.push({
      teamA: teamA ?? "",
      teamB: teamB ?? "",
      status,
      liveScore,
      matchMinute: r.fixture?.status?.elapsed ?? undefined,
      utcTimestamp: isoDate ? new Date(isoDate).toISOString() : undefined,
      stadium: r.fixture?.venue?.name ?? undefined,
      city: r.fixture?.venue?.city ?? undefined,
      matchId,
    });
  }
  return out;
}

function mapStatus(s: string): LiveFixture["status"] {
  if (["NS", "TBD", "PST"].includes(s)) return "scheduled";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(s)) return "finished";
  return "live";
}

/**
 * Merge live fixtures into the match store by pairing on team codes
 * (order-independent). Falls kein Team-Match möglich ist (z.B. weil das
 * persistierte Fixture keine Team-Namen kennt), wird sekundär auf die
 * OpenLigaDB-matchId gepaart — sofern der lokale Match sie kennt.
 */
export function applyLiveFixturesToStore(fixtures: LiveFixture[]): void {
  if (fixtures.length === 0) return;
  const state = useMatchStore.getState();
  const all = Object.values(state.matches);
  for (const f of fixtures) {
    let match = f.teamA && f.teamB
      ? all.find(
          (m) =>
            (m.teamA === f.teamA && m.teamB === f.teamB) ||
            (m.teamA === f.teamB && m.teamB === f.teamA),
        )
      : undefined;
    let matchedById = false;
    if (!match && f.matchId) {
      match = all.find(
        (m) => (m as { apiMatchId?: string }).apiMatchId === f.matchId,
      );
      matchedById = !!match;
    }
    if (!match) continue;
    const flipped = !!f.teamA && match.teamA !== f.teamA;
    const liveScore =
      f.liveScore && flipped
        ? { a: f.liveScore.b, b: f.liveScore.a }
        : f.liveScore;
    // Bracket-Upgrade nur, wenn wir via matchId gepaart haben — dann darf die
    // API die Platzhalter-Codes im Slot ersetzen. Bei Team-Match sind teamA/B
    // per Definition schon echte Codes; kein Upgrade nötig.
    state.applyApiUpdate(match.id, {
      status: f.status,
      liveScore,
      matchMinute: f.matchMinute,
      utcTimestamp: f.utcTimestamp,
      stadium: f.stadium,
      city: f.city,
      ...(matchedById && f.teamA ? { teamA: f.teamA } : {}),
      ...(matchedById && f.teamB ? { teamB: f.teamB } : {}),
    });
    if (f.status === "finished" && liveScore) {
      state.finishMatchFromApi(match.id, liveScore);
    }
  }
}

export { getTeam };
