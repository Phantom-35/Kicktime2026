/**
 * ============================================================================
 *  Live scores service — Supabase Edge Function proxy
 * ============================================================================
 *
 *  All live data flows through the Supabase Edge Function `fetch-live-scores`.
 *  The frontend NEVER calls api-football.com directly, so the API key stays
 *  server-side (critical for the iOS bundle).
 *
 *  Setup:
 *   1. Supabase Dashboard → Edge Functions → Secrets → add `API_FOOTBALL_KEY`
 *   2. The function in `supabase/functions/fetch-live-scores/` auto-deploys.
 * ============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useMatchStore } from "@/store/match-store";
import { MATCHES } from "@/data/matches";
import { TEAMS, getTeam } from "@/data/teams";

export type LiveFixture = {
  teamA: string;
  teamB: string;
  status: "scheduled" | "live" | "finished";
  liveScore?: { a: number; b: number };
  matchMinute?: number;
};

type RawFixture = {
  fixture?: { status?: { short?: string; elapsed?: number | null } };
  teams?: { home?: { name?: string }; away?: { name?: string } };
  goals?: { home?: number | null; away?: number | null };
};

export function isLiveDataEnabled(): boolean {
  return isSupabaseConfigured();
}

/**
 * Calls the Supabase Edge Function and returns normalized live fixtures.
 * Always returns an array — never throws — so the polling loop stays alive
 * even when the function is misconfigured.
 */
export async function fetchLiveWorldCupData(): Promise<LiveFixture[]> {
  if (!isLiveDataEnabled()) {
    if (typeof window !== "undefined") {
      console.info(
        "[footballApi] Supabase not configured — using local fixture schedule."
      );
    }
    return [];
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      fixtures?: RawFixture[];
      error?: string;
    }>("fetch-live-scores");

    if (error) {
      console.warn("[footballApi] edge function error", error.message);
      return [];
    }
    if (data?.error) {
      console.warn("[footballApi] edge function returned error", data.error);
      return [];
    }
    return normalize(data?.fixtures ?? []);
  } catch (err) {
    console.warn("[footballApi] invoke failed", err);
    return [];
  }
}

function normalize(raw: RawFixture[]): LiveFixture[] {
  const out: LiveFixture[] = [];
  for (const r of raw) {
    const homeName = r.teams?.home?.name;
    const awayName = r.teams?.away?.name;
    if (!homeName || !awayName) continue;
    const teamA = nameToCode(homeName);
    const teamB = nameToCode(awayName);
    if (!teamA || !teamB) continue;
    out.push({
      teamA,
      teamB,
      status: mapStatus(r.fixture?.status?.short ?? "NS"),
      liveScore:
        r.goals?.home != null && r.goals?.away != null
          ? { a: r.goals.home, b: r.goals.away }
          : undefined,
      matchMinute: r.fixture?.status?.elapsed ?? undefined,
    });
  }
  return out;
}

function mapStatus(s: string): LiveFixture["status"] {
  if (["NS", "TBD", "PST"].includes(s)) return "scheduled";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(s)) return "finished";
  return "live";
}

const nameIndex: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const t of TEAMS) out[t.name.toLowerCase()] = t.code;
  return out;
})();

function nameToCode(name: string): string | null {
  return nameIndex[name.toLowerCase()] ?? null;
}

/** Merge live fixtures into the match store, pairing by team-code pair. */
export function applyLiveFixturesToStore(fixtures: LiveFixture[]): void {
  if (fixtures.length === 0) return;
  const apply = useMatchStore.getState().applyLiveUpdate;
  for (const f of fixtures) {
    const match = MATCHES.find(
      (m) =>
        (m.teamA === f.teamA && m.teamB === f.teamB) ||
        (m.teamA === f.teamB && m.teamB === f.teamA)
    );
    if (!match) continue;
    const flipped = match.teamA !== f.teamA;
    const liveScore =
      f.liveScore && flipped
        ? { a: f.liveScore.b, b: f.liveScore.a }
        : f.liveScore;
    apply(match.id, {
      status: f.status,
      liveScore,
      matchMinute: f.matchMinute,
    });
  }
}

export { getTeam };
