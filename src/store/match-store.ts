import { create } from "zustand";
import scheduleJson from "@/data/world_cup_2026_schedule.json";
import type { Match, MatchStage, Broadcaster } from "@/data/matches";
import { KO_STATIC_OVERRIDES } from "@/data/ko-static";
import { calculateTableStandings } from "@/lib/standings";
import { applyTvOverride } from "@/lib/tv-overrides";
import { isPlaceholderTeam } from "@/lib/ko-phase";

export type MatchStatus = "scheduled" | "live" | "finished";

export type RuntimeMatch = Match & {
  status: MatchStatus;
  liveScore?: { a: number; b: number };
  matchMinute?: number;
  /** Timestamp of the most recent manual override. While set, the API layer
   *  ignores stale data that matches the pre-override signature. */
  manualAt?: number;
  /** Signature of the last accepted API payload (`status|a:b|min`). Used to
   *  detect whether new API data is a real change vs. a re-broadcast. */
  lastApiSignature?: string;
};

export type LiveUpdate = {
  liveScore?: { a: number; b: number };
  matchMinute?: number;
  status?: MatchStatus;
  utcTimestamp?: string;
  stadium?: string;
  city?: string;
  /** Wenn gesetzt und der aktuelle Slot einen Platzhalter-Code trägt, werden
   *  teamA/teamB durch echte Nationalcodes ersetzt. Echte Codes werden nie
   *  überschrieben. */
  teamA?: string;
  teamB?: string;
};

type State = {
  matches: Record<string, RuntimeMatch>;
  now: number;
};

type Actions = {
  applyLiveUpdate: (id: string, u: LiveUpdate) => void;
  applyManualUpdate: (id: string, u: LiveUpdate) => void;
  applyApiUpdate: (id: string, u: LiveUpdate) => void;
  finishMatch: (id: string, finalScore: { a: number; b: number }) => void;
  finishMatchFromApi: (id: string, finalScore: { a: number; b: number }) => void;
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
    // v7.5.0: feste Achtel-/Sechzehntelfinal-Paarungen aus ko-static.ts
    // überschreiben die generischen Platzhalter aus dem Schedule-JSON.
    const ov = KO_STATIC_OVERRIDES[raw.id];
    const merged = ov ? { ...raw, ...ov } : raw;
    const base: RuntimeMatch = {
      ...merged,
      stage: merged.stage as MatchStage,
      broadcaster: merged.broadcaster as Broadcaster,
      broadcasters: merged.broadcasters as Broadcaster[] | undefined,
      hostCountry: merged.hostCountry as Match["hostCountry"],
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

  applyLiveUpdate: (id, u) => applyUpdateInternal(set, id, u, "manual"),
  applyManualUpdate: (id, u) => applyUpdateInternal(set, id, u, "manual"),
  applyApiUpdate: (id, u) => applyUpdateInternal(set, id, u, "api"),

  finishMatch: (id, finalScore) =>
    set((s) => {
      const cur = s.matches[id];
      if (!cur) return s;
      if (
        cur.status === "finished" &&
        cur.score?.a === finalScore.a &&
        cur.score?.b === finalScore.b
      ) {
        return s;
      }
      return {
        matches: {
          ...s.matches,
          [id]: {
            ...cur,
            status: "finished",
            score: finalScore,
            liveScore: undefined,
            matchMinute: undefined,
            manualAt: Date.now(),
          },
        },
      };
    }),

  finishMatchFromApi: (id, finalScore) =>
    set((s) => {
      const cur = s.matches[id];
      if (!cur) return s;
      // The "finished" signal from the API MUST always flip the status — even
      // if a manual override is in place. We only preserve the manual SCORE
      // (so corrections don't get overwritten by stale API totals).
      const preserveManualScore = !!cur.manualAt;
      const score = preserveManualScore
        ? (cur.liveScore ?? cur.score ?? finalScore)
        : finalScore;
      const apiSig = `finished|${finalScore.a}:${finalScore.b}|`;
      if (
        cur.status === "finished" &&
        cur.score?.a === score.a &&
        cur.score?.b === score.b
      ) {
        if (cur.lastApiSignature === apiSig) return s;
        return {
          matches: { ...s.matches, [id]: { ...cur, lastApiSignature: apiSig } },
        };
      }
      return {
        matches: {
          ...s.matches,
          [id]: {
            ...cur,
            status: "finished",
            score,
            liveScore: undefined,
            matchMinute: undefined,
            // Drop the manual lock once we've finalized — match is over.
            manualAt: undefined,
            lastApiSignature: apiSig,
          },
        },
      };
    }),

  clearLiveOverlay: (id) =>
    set((s) => {
      const cur = s.matches[id];
      if (!cur) return s;
      // Reset to a clean scheduled state — the next API poll re-fills it.
      // Clear manualAt so the API layer is free to take over again.
      return {
        matches: {
          ...s.matches,
          [id]: {
            ...cur,
            status: "scheduled",
            liveScore: undefined,
            matchMinute: undefined,
            score: cur.status === "finished" ? cur.score : undefined,
            manualAt: undefined,
            lastApiSignature: undefined,
          },
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

type SetFn = (fn: (s: State & Actions) => Partial<State & Actions> | State & Actions) => void;

function signatureOf(m: Pick<RuntimeMatch, "status" | "liveScore" | "matchMinute">): string {
  const a = m.liveScore?.a ?? "";
  const b = m.liveScore?.b ?? "";
  const min = m.matchMinute ?? "";
  return `${m.status}|${a}:${b}|${min}`;
}

function applyUpdateInternal(
  set: SetFn,
  id: string,
  u: LiveUpdate,
  source: "manual" | "api"
): void {
  set((s) => {
    const cur = s.matches[id];
    if (!cur) return s;

    const merged: RuntimeMatch = {
      ...cur,
      ...(u.liveScore !== undefined ? { liveScore: u.liveScore } : {}),
      ...(u.matchMinute !== undefined ? { matchMinute: u.matchMinute } : {}),
      ...(u.status !== undefined ? { status: u.status } : {}),
      ...(u.utcTimestamp !== undefined ? { utcTimestamp: u.utcTimestamp } : {}),
      ...(u.stadium !== undefined ? { stadium: u.stadium } : {}),
      ...(u.city !== undefined ? { city: u.city } : {}),
      // Bracket-Upgrade: Platzhalter-Codes (z.B. "W:m-073|m-074", "1A") werden
      // durch echte Nationalcodes ersetzt, sobald die API sie liefert. Echte
      // Codes bleiben unangetastet — kein Team-Swap durch API-Fehlpayload.
      ...(u.teamA && isPlaceholderTeam(cur.teamA) && !isPlaceholderTeam(u.teamA)
        ? { teamA: u.teamA }
        : {}),
      ...(u.teamB && isPlaceholderTeam(cur.teamB) && !isPlaceholderTeam(u.teamB)
        ? { teamB: u.teamB }
        : {}),
    };

    // Guard: never demote a finished match back to live/scheduled via either
    // path. Once a match has ended (with a real score), the only legitimate
    // change is the final score itself — the status MUST stay "finished".
    // Ausnahme: Wenn cur ein "Zombie"-finished ohne Score ist (z.B. Fehler-
    // Payload), darf ein neues API-Update den Zustand wieder korrigieren.
    // Ausnahme: Ein MANUELLER Override darf ein fälschlich als "finished"
    // markiertes Spiel zurück in den Live-Modus schieben (z.B. wenn die API
    // zu früh "beendet" meldet, das Spiel aber noch läuft / Nachspielzeit /
    // Verlängerung). API-Updates dürfen finished nicht demoten.
    const curFinishedWithScore = cur.status === "finished" && !!cur.score;
    if (curFinishedWithScore && merged.status !== "finished" && source === "api") {
      merged.status = "finished";
      merged.liveScore = undefined;
      merged.matchMinute = undefined;
    }
    if (source === "manual" && cur.status === "finished" && merged.status !== "finished") {
      // Alten "Endstand" verwerfen — UI wartet wieder auf echte Endstand-API.
      merged.score = undefined;
    }

    // Guard: if the regulation+ET window has elapsed and the incoming update
    // says "live", auto-promote to "finished". Manuelle Overrides sind
    // hiervon ausgenommen — der Admin weiß, dass das Spiel noch läuft.
    if (merged.status === "live" && source === "api") {
      const endsAt = new Date(merged.utcTimestamp).getTime() + MATCH_DURATION_MS;
      if (Date.now() >= endsAt) {
        const finalScore = merged.liveScore ?? cur.liveScore ?? cur.score;
        merged.status = "finished";
        if (finalScore) merged.score = finalScore;
        merged.liveScore = undefined;
        merged.matchMinute = undefined;
      }
    }

    const curSig = signatureOf(cur);
    const newSig = signatureOf(merged);

    if (source === "api") {
      // Manual override in place → API-Updates komplett verwerfen.
      // Der Lock wird nur durch clearLiveOverlay (Admin entfernt Override)
      // oder finishMatchFromApi (offizielles Endergebnis) aufgehoben.
      if (cur.manualAt) {
        return s;
      }
    } else {
      // Manual write: mark precedence.
      merged.manualAt = Date.now();
    }


    // Equality guard: no UI-visible change → skip set() entirely.
    if (
      curSig === newSig &&
      cur.utcTimestamp === merged.utcTimestamp &&
      cur.stadium === merged.stadium &&
      cur.city === merged.city &&
      cur.teamA === merged.teamA &&
      cur.teamB === merged.teamB &&
      cur.manualAt === merged.manualAt &&
      cur.lastApiSignature === merged.lastApiSignature
    ) {
      return s;
    }

    return { matches: { ...s.matches, [id]: merged } };
  });
}


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
      } else {
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
