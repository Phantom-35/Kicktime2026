import { create } from "zustand";
import scheduleJson from "@/data/world_cup_2026_schedule.json";
import type { Match, MatchStage, Broadcaster } from "@/data/matches";

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
};

type State = {
  matches: Record<string, RuntimeMatch>;
  now: number;
};

type Actions = {
  applyLiveUpdate: (id: string, u: LiveUpdate) => void;
  finishMatch: (id: string, finalScore: { a: number; b: number }) => void;
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
  for (const raw of scheduleJson as Array<Omit<Match, "status">>) {
    const m: RuntimeMatch = {
      ...raw,
      stage: raw.stage as MatchStage,
      broadcaster: raw.broadcaster as Broadcaster,
      hostCountry: raw.hostCountry as Match["hostCountry"],
      status: "scheduled",
    };
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

  tickClock: (deltaMs) =>
    set((s) => {
      const now = s.now + deltaMs;
      return { now, matches: rollMatches(s.matches, now) };
    }),

  syncWithRealTime: () =>
    set((s) => {
      const now = Date.now();
      return { now, matches: rollMatches(s.matches, now) };
    }),

  setNow: (ts) => set({ now: ts }),

  replaceAll: (payload) =>
    set(() => {
      const next: Record<string, RuntimeMatch> = {};
      for (const m of payload) next[m.id] = m;
      return { matches: next };
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
      const finalScore = m.liveScore ?? m.score ?? { a: 0, b: 0 };
      next[id] = { ...m, status: "finished", score: finalScore, liveScore: undefined, matchMinute: undefined };
      changed = true;
    } else if (now >= kickoff) {
      const minute = Math.min(90, Math.max(1, Math.floor((now - kickoff) / 60000)));
      if (m.status !== "live") {
        next[id] = { ...m, status: "live", matchMinute: minute, liveScore: m.liveScore ?? { a: 0, b: 0 } };
        changed = true;
      } else if (m.matchMinute !== minute) {
        next[id] = { ...m, matchMinute: minute };
        changed = true;
      }
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
