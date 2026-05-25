import { create } from "zustand";
import { MATCHES, type Match } from "@/data/matches";

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
  setNow: (ts: number) => void;
  replaceAll: (payload: RuntimeMatch[]) => void;
  resetMatches: () => void;
};

const DEMO_NOW = new Date("2026-06-10T12:00:00Z").getTime();
const MATCH_DURATION_MS = 110 * 60 * 1000;

function seed(): Record<string, RuntimeMatch> {
  const out: Record<string, RuntimeMatch> = {};
  for (const m of MATCHES) {
    out[m.id] = { ...m, status: m.status };
  }
  return out;
}

/**
 * Single source of truth for match runtime data. Designed so a real sports
 * API can swap in via `replaceAll` / `applyLiveUpdate` / `finishMatch`.
 */
export const useMatchStore = create<State & Actions>((set) => ({
  matches: seed(),
  now: DEMO_NOW,

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
      const next: Record<string, RuntimeMatch> = { ...s.matches };
      for (const id in next) {
        const m = next[id];
        const kickoff = new Date(m.utcTimestamp).getTime();
        const endsAt = kickoff + MATCH_DURATION_MS;
        if (m.status === "finished") continue;
        if (now >= endsAt) {
          const finalScore =
            m.liveScore ?? m.score ?? {
              a: Math.floor(Math.random() * 4),
              b: Math.floor(Math.random() * 4),
            };
          next[id] = { ...m, status: "finished", score: finalScore, liveScore: undefined, matchMinute: undefined };
        } else if (now >= kickoff && m.status === "scheduled") {
          const minute = Math.min(90, Math.floor((now - kickoff) / 60000));
          next[id] = { ...m, status: "live", matchMinute: minute, liveScore: m.liveScore ?? { a: 0, b: 0 } };
        } else if (m.status === "live") {
          const minute = Math.min(90, Math.floor((now - kickoff) / 60000));
          next[id] = { ...m, matchMinute: minute };
        }
      }
      return { now, matches: next };
    }),

  setNow: (ts) => set({ now: ts }),

  replaceAll: (payload) =>
    set(() => {
      const next: Record<string, RuntimeMatch> = {};
      for (const m of payload) next[m.id] = m;
      return { matches: next };
    }),

  resetMatches: () => set({ matches: seed(), now: DEMO_NOW }),
}));

let cachedMatchesRecord: State["matches"] | undefined;
let cachedMatchList: RuntimeMatch[] = [];

export function selectMatchList(s: State): RuntimeMatch[] {
  if (s.matches === cachedMatchesRecord) return cachedMatchList;
  cachedMatchesRecord = s.matches;
  cachedMatchList = Object.values(s.matches);
  return cachedMatchList;
}
