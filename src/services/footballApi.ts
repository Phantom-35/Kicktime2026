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
};

type RawFixture = {
  fixture?: { status?: { short?: string; elapsed?: number | null } };
  teams?: { home?: { name?: string }; away?: { name?: string } };
  goals?: { home?: number | null; away?: number | null };
};

export function isLiveDataEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function fetchLiveWorldCupData(): Promise<LiveFixture[]> {
  if (!isLiveDataEnabled()) return [];

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
    const teamA = apiNameToCode(homeName);
    const teamB = apiNameToCode(awayName);
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

/**
 * Merge live fixtures into the match store by pairing on team codes
 * (order-independent). Live updates flip status, update minute/score, and
 * finalize the result when the match ends — feeding live standings.
 */
export function applyLiveFixturesToStore(fixtures: LiveFixture[]): void {
  if (fixtures.length === 0) return;
  const state = useMatchStore.getState();
  const all = Object.values(state.matches);
  for (const f of fixtures) {
    const match = all.find(
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
    if (f.status === "finished" && liveScore) {
      state.finishMatch(match.id, liveScore);
    } else {
      state.applyLiveUpdate(match.id, {
        status: f.status,
        liveScore,
        matchMinute: f.matchMinute,
      });
    }
  }
}

export { getTeam };
