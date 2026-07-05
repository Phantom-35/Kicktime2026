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
  const unpaired: LiveFixture[] = [];
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
    if (!match) {
      // Kein Team-Match, keine matchId — potenzieller Bracket-Upgrade-Kandidat.
      if (f.teamA && f.teamB && f.utcTimestamp) unpaired.push(f);
      continue;
    }
    const flipped = !!f.teamA && match.teamA !== f.teamA;
    const liveScore =
      f.liveScore && flipped
        ? { a: f.liveScore.b, b: f.liveScore.a }
        : f.liveScore;
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

  // Fallback: Unpaarbare Fixtures via Kickoff-Fenster einer KO-Stage zuordnen
  // und stage-weise durch die Bracket-Upgrade-Logik laufen lassen. So werden
  // Platzhalter-Slots (z. B. "W:m-073|m-074") beim Rehydrieren aus
  // `match_results` durch echte Teams ersetzt, auch ohne apiMatchId am Slot.
  if (unpaired.length === 0) return;
  const stages: Array<"r16" | "qf" | "sf" | "third" | "final"> = [
    "r16", "qf", "sf", "third", "final",
  ];
  const ONE_DAY = 24 * 60 * 60 * 1000;
  for (const stage of stages) {
    const slots = all.filter((m) => m.stage === stage);
    if (slots.length === 0) continue;
    const times = slots.map((m) => new Date(m.utcTimestamp).getTime());
    const min = Math.min(...times) - ONE_DAY;
    const max = Math.max(...times) + ONE_DAY;
    const inWindow = unpaired.filter((f) => {
      const t = new Date(f.utcTimestamp!).getTime();
      return t >= min && t <= max;
    });
    if (inWindow.length === 0) continue;
    applyBracketUpgradeFromApi(stage, inWindow);
  }
}

/**
 * Bracket-Prefetch-Anwendung: Für eine bestimmte KO-Phase (z. B. "r16")
 * werden API-Fixtures mit echten Team-Codes auf die lokalen Placeholder-
 * Slots angewandt. Paar-Reihenfolge: (1) Team-Match, (2) Kickoff ±6h,
 * (3) chronologischer Index innerhalb der Phase.
 */
export function applyBracketUpgradeFromApi(
  stage: "r16" | "qf" | "sf" | "third" | "final",
  fixtures: LiveFixture[],
): number {
  const realFixtures = fixtures.filter(
    (f) => f.teamA && f.teamB && f.utcTimestamp,
  );
  if (realFixtures.length === 0) return 0;

  // Dedupe: gleiche Team-Paarung / matchId darf nur EINMAL angewandt werden.
  // Sonst hängt der Index-Fallback (Pass 3) eine zweite Kopie derselben
  // Begegnung an einen anderen Slot — visuell erscheint das Spiel dann
  // doppelt (z. B. FRA-MAR zweimal am gleichen Anstoßzeitpunkt).
  const seenPair = new Set<string>();
  const seenId = new Set<string>();
  const deduped: LiveFixture[] = [];
  for (const f of realFixtures) {
    const pairKey = [f.teamA, f.teamB].sort().join("|");
    if (seenPair.has(pairKey)) continue;
    if (f.matchId && seenId.has(f.matchId)) continue;
    seenPair.add(pairKey);
    if (f.matchId) seenId.add(f.matchId);
    deduped.push(f);
  }

  const state = useMatchStore.getState();
  const slots = Object.values(state.matches)
    .filter((m) => m.stage === stage)
    .sort(
      (a, b) =>
        new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime(),
    );
  if (slots.length === 0) return 0;

  const sortedFixtures = [...deduped].sort(
    (a, b) =>
      new Date(a.utcTimestamp!).getTime() - new Date(b.utcTimestamp!).getTime(),
  );

  const used = new Set<string>();
  let upgraded = 0;
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  // Guard: Existiert diese Team-Paarung bereits in einem Slot der Phase
  // (belegt oder nicht)? Wenn ja, darf sie NICHT nochmal einem anderen Slot
  // zugewiesen werden — sonst entsteht ein Duplikat.
  const pairAlreadyInStage = (f: LiveFixture): boolean =>
    slots.some(
      (m) =>
        (m.teamA === f.teamA && m.teamB === f.teamB) ||
        (m.teamA === f.teamB && m.teamB === f.teamA),
    );

  const tryUpgrade = (slot: (typeof slots)[number], f: LiveFixture) => {
    const flipped = slot.teamA !== f.teamA && slot.teamB === f.teamA;
    const liveScore =
      f.liveScore && flipped
        ? { a: f.liveScore.b, b: f.liveScore.a }
        : f.liveScore;
    const teamA = flipped ? f.teamB : f.teamA;
    const teamB = flipped ? f.teamA : f.teamB;
    state.applyApiUpdate(slot.id, {
      status: f.status,
      liveScore,
      matchMinute: f.matchMinute,
      utcTimestamp: f.utcTimestamp,
      stadium: f.stadium,
      city: f.city,
      teamA,
      teamB,
    });
    if (f.status === "finished" && liveScore) {
      state.finishMatchFromApi(slot.id, liveScore);
    }
    used.add(slot.id);
    // Lokale Slot-Kopie mitziehen, damit pairAlreadyInStage in späteren
    // Pässen die frisch belegte Paarung sieht.
    slot.teamA = teamA;
    slot.teamB = teamB;
    upgraded++;
  };

  // Pass 1: exakter Team-Match
  for (const f of sortedFixtures) {
    const slot = slots.find(
      (m) =>
        !used.has(m.id) &&
        ((m.teamA === f.teamA && m.teamB === f.teamB) ||
          (m.teamA === f.teamB && m.teamB === f.teamA)),
    );
    if (slot) tryUpgrade(slot, f);
  }

  // Pass 2: Kickoff ±6h — nur wenn die Paarung noch nirgends steht.
  for (const f of sortedFixtures) {
    if (used.size === slots.length) break;
    if (pairAlreadyInStage(f)) continue;
    const fTs = new Date(f.utcTimestamp!).getTime();
    const slot = slots.find(
      (m) =>
        !used.has(m.id) &&
        Math.abs(new Date(m.utcTimestamp).getTime() - fTs) <= SIX_HOURS,
    );
    if (slot) tryUpgrade(slot, f);
  }

  // Pass 3: chronologischer Index-Fallback — nur für Paarungen, die noch
  // NIRGENDS in der Phase existieren.
  const remainingSlots = slots.filter((m) => !used.has(m.id));
  const remainingFixtures = sortedFixtures.filter((f) => !pairAlreadyInStage(f));
  const pairs = Math.min(remainingSlots.length, remainingFixtures.length);
  for (let i = 0; i < pairs; i++) {
    tryUpgrade(remainingSlots[i], remainingFixtures[i]);
  }

  return upgraded;
}

export { getTeam };
