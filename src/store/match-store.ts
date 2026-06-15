import { create } from "zustand";
import scheduleJson from "@/data/world_cup_2026_schedule.json";
import type { Match, MatchStage, Broadcaster } from "@/data/matches";
import { calculateTableStandings } from "@/lib/standings";
import { applyTvOverride } from "@/lib/tv-overrides";

export type MatchStatus = "scheduled" | "live" | "finished";

export type RuntimeMatch = Match & {
  status: MatchStatus;
  liveScore?: { a: number; b: number };
  matchMinute?: number;
};

export type LiveUpdate = {
  liveScore?: { a: number; b: number };
  matchMinute?: number;
  status?: MatchStatus;
  utcTimestamp?: string;
  stadium?: string;
  city?: string;
};

type State = {
  matches: Record<string, RuntimeMatch>;
  now: number;
};

type Actions = {
  applyLiveUpdate: (id: string, u: LiveUpdate) => void;
  finishMatch: (id: string, finalScore: { a: number; b: number }) => void;
  clearLiveOverlay: (id: string) => void;
  tickClock: (deltaMs: number) => void;
  syncWithRealTime: () => void;
  setNow: (ts: number) => void;
  replaceAll: (payload: RuntimeMatch[]) => void;
  resetMatches: () => void;
};

const MATCH_DURATION_MS = 115 * 60 * 1000;

/**
 * Seed the store from the static FIFA 2026 schedule JSON. This is the single
 * source of truth for fixture, venue, kickoff and broadcaster data. Live
 * scores are merged in via `applyLiveUpdate` from `services/footballApi`.
 */
function seed(): Record<string, RuntimeMatch> {
  const out: Record<string, RuntimeMatch> = {};
  for (const raw of scheduleJson as Array<Omit<Match, "status"> & { broadcasters?: Broadcaster[] }>) {
    const base: RuntimeMatch = {
      ...raw,
      stage: raw.stage as MatchStage,
      broadcaster: raw.broadcaster as Broadcaster,
      broadcasters: raw.broadcasters as Broadcaster[] | undefined,
      hostCountry: raw.hostCountry as Match["hostCountry"],
      status: "scheduled",
    };
    const m = applyTvOverride(base);
    out[m.id] = m;
  }
  return out;
}

export const useMatchStore = create<State & Actions>((set) => ({
  matches: seed(),
  now: Date.now(),

  applyLiveUpdate: (id, u) =>
    set((s) => {
      const cur = s.matches[id];
      if (!cur) return s;
      return {
        matches: {
          ...s.matches,
          [id]: {
            ...cur,
            ...(u.liveScore !== undefined ? { liveScore: u.liveScore } : {}),
            ...(u.matchMinute !== undefined ? { matchMinute: u.matchMinute } : {}),
            ...(u.status !== undefined ? { status: u.status } : {}),
            ...(u.utcTimestamp !== undefined ? { utcTimestamp: u.utcTimestamp } : {}),
            ...(u.stadium !== undefined ? { stadium: u.stadium } : {}),
            ...(u.city !== undefined ? { city: u.city } : {}),
          },
        },
      };
    }),

  finishMatch: (id, finalScore) =>
    set((s) => {
      const cur = s.matches[id];
      if (!cur) return s;
      return {
        matches: {
          ...s.matches,
          [id]: { ...cur, status: "finished", score: finalScore, liveScore: undefined, matchMinute: undefined },
        },
      };
    }),

  clearLiveOverlay: (id) =>
    set((s) => {
      const cur = s.matches[id];
      if (!cur) return s;
      // Reset to a clean scheduled state — the next API poll re-fills it.
      return {
        matches: {
          ...s.matches,
          [id]: { ...cur, status: "scheduled", liveScore: undefined, matchMinute: undefined, score: cur.status === "finished" ? cur.score : undefined },
        },
      };
    }),

  tickClock: (deltaMs) =>
    set((s) => {
      const now = s.now + deltaMs;
      return { now, matches: rollMatches(s.matches, now) };
    }),

  syncWithRealTime: () =>
    set((s) => {
      const now = Date.now();
      const rolled = rollMatches(s.matches, now);
      const resolved = resolveKnockoutPlaceholders(rolled);
      return { now, matches: resolved };
    }),

  setNow: (ts) => set({ now: ts }),

  replaceAll: (payload) =>
    set(() => {
      const next: Record<string, RuntimeMatch> = {};
      for (const m of payload) next[m.id] = m;
      return { matches: resolveKnockoutPlaceholders(next) };
    }),

  resetMatches: () => set({ matches: seed(), now: Date.now() }),
}));

function rollMatches(
  matches: Record<string, RuntimeMatch>,
  now: number
): Record<string, RuntimeMatch> {
  let changed = false;
  const next: Record<string, RuntimeMatch> = { ...matches };
  for (const id in next) {
    const m = next[id];
    if (m.status === "finished") continue;
    const kickoff = new Date(m.utcTimestamp).getTime();
    const endsAt = kickoff + MATCH_DURATION_MS;
    if (now >= endsAt) {
      // Only finalize when we actually have a score from API/live data.
      // Otherwise leave status as-is so the UI shows a neutral placeholder
      // ("-:-") instead of fabricating a fake 0:0 result.
      const finalScore = m.liveScore ?? m.score;
      if (finalScore) {
        next[id] = { ...m, status: "finished", score: finalScore, liveScore: undefined, matchMinute: undefined };
        changed = true;
      } else if (m.status !== "finished") {
        next[id] = { ...m, status: "finished", score: undefined, liveScore: undefined, matchMinute: undefined };
        changed = true;
      }
    } else if (now >= kickoff) {
      // Prefer real elapsed minute from API; fall back to wall-clock estimate.
      const estimated = Math.min(90, Math.max(1, Math.floor((now - kickoff) / 60000)));
      if (m.status !== "live") {
        const minute = m.matchMinute ?? estimated;
        next[id] = { ...m, status: "live", matchMinute: minute, liveScore: m.liveScore ?? { a: 0, b: 0 } };
        changed = true;
      } else if (m.matchMinute === undefined && m.matchMinute !== estimated) {
        // Only update from wall-clock when API hasn't supplied a real value yet.
        next[id] = { ...m, matchMinute: estimated };
        changed = true;
      }
    }
  }
  return changed ? next : matches;
}

/**
 * Replace group-stage placeholders ("1A", "2B", "3F" etc.) in unfinished
 * knockout matches with the actual qualified teams once the corresponding
 * group is fully decided. Runs idempotently — already-resolved matches are
 * skipped. "3XXXXX"-style placeholders (best-of-third-place) are left
 * untouched here; those come from the API once FIFA confirms the bracket.
 */
function resolveKnockoutPlaceholders(
  matches: Record<string, RuntimeMatch>
): Record<string, RuntimeMatch> {
  const list = Object.values(matches);

  // Detect groups whose 4 matches all finished.
  const groupDone = new Map<string, string[]>(); // group -> ordered team codes (1st..4th)
  for (const letter of ["A","B","C","D","E","F","G","H","I","J","K","L"]) {
    const groupMatches = list.filter((m) => m.stage === "group" && m.group === letter);
    if (groupMatches.length === 0) continue;
    const allFinished = groupMatches.every((m) => m.status === "finished" && m.score);
    if (!allFinished) continue;
    const standings = calculateTableStandings(letter, groupMatches);
    groupDone.set(letter, standings.map((r) => r.code));
  }
  if (groupDone.size === 0) return matches;

  const resolve = (code: string): string => {
    const m = code.match(/^([12])([A-L])$/);
    if (!m) return code;
    const ranks = groupDone.get(m[2]);
    if (!ranks) return code;
    const idx = parseInt(m[1], 10) - 1;
    return ranks[idx] ?? code;
  };

  let changed = false;
  const next: Record<string, RuntimeMatch> = { ...matches };
  for (const m of list) {
    if (m.stage === "group" || m.status === "finished") continue;
    const newA = resolve(m.teamA);
    const newB = resolve(m.teamB);
    if (newA !== m.teamA || newB !== m.teamB) {
      next[m.id] = { ...m, teamA: newA, teamB: newB };
      changed = true;
    }
  }
  return changed ? next : matches;
}

let cachedMatchesRecord: State["matches"] | undefined;
let cachedMatchList: RuntimeMatch[] = [];

export function selectMatchList(s: State): RuntimeMatch[] {
  if (s.matches === cachedMatchesRecord) return cachedMatchList;
  cachedMatchesRecord = s.matches;
  cachedMatchList = Object.values(s.matches);
  return cachedMatchList;
}
