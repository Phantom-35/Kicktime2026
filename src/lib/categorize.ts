import type { Match } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { matchInAvailability } from "./time";
import type { Window } from "@/store/app-store";
import type { RuntimeMatch } from "@/store/match-store";

export type Categorized = {
  perfect: RuntimeMatch[];
  nightShift: RuntimeMatch[];
  missed: RuntimeMatch[];
};

type Params = {
  favoriteTeams: string[];
  interestingTeams: string[];
  availability: { weekday: Window; weekend: Window };
  userTimezone: string;
  matches: RuntimeMatch[];
  now: number;
};

export function categorizeMatches(p: Params): Categorized {
  const perfect: RuntimeMatch[] = [];
  const nightShift: RuntimeMatch[] = [];
  const missed: RuntimeMatch[] = [];

  for (const m of p.matches) {
    const involvesFav =
      p.favoriteTeams.includes(m.teamA) || p.favoriteTeams.includes(m.teamB);
    const involvesInt =
      p.interestingTeams.includes(m.teamA) || p.interestingTeams.includes(m.teamB);
    // In der KO-Phase ist JEDES Spiel automatisch relevant — die Platzhalter-Codes
    // (z. B. W49, RU-A) matchen sonst keine Favoriten und die Liste bliebe leer.
    const isKo = m.stage !== "group";
    const involvesAny = isKo ? true : involvesFav || involvesInt;
    const isMarquee =
      getTeam(m.teamA).tier === 1 && getTeam(m.teamB).tier === 1;
    const inWindow = matchInAvailability(m.utcTimestamp, p.userTimezone, p.availability);
    const kickoff = new Date(m.utcTimestamp).getTime();
    const isPast = m.status === "finished" || kickoff < p.now - 110 * 60 * 1000;

    if (isPast || m.status === "finished") {
      if (involvesAny) missed.push(m);
      continue;
    }
    if (involvesAny && inWindow) {
      perfect.push(m);
    } else if ((involvesFav || isMarquee || isKo) && !inWindow) {
      nightShift.push(m);
    }
  }

  const byTime = (a: Match, b: Match) =>
    new Date(a.utcTimestamp).getTime() - new Date(b.utcTimestamp).getTime();
  return {
    perfect: perfect.sort(byTime),
    nightShift: nightShift.sort(byTime),
    missed: missed.sort((a, b) => byTime(b, a)),
  };
}

export function isPerfectFor(m: Match, p: Omit<Params, "matches" | "now">) {
  const involvesAny =
    p.favoriteTeams.includes(m.teamA) || p.favoriteTeams.includes(m.teamB) ||
    p.interestingTeams.includes(m.teamA) || p.interestingTeams.includes(m.teamB);
  return involvesAny && matchInAvailability(m.utcTimestamp, p.userTimezone, p.availability);
}

export function isNightShift(m: Match, p: Omit<Params, "matches" | "now">) {
  const inWindow = matchInAvailability(m.utcTimestamp, p.userTimezone, p.availability);
  const isMarquee = getTeam(m.teamA).tier === 1 && getTeam(m.teamB).tier === 1;
  const involvesFav = p.favoriteTeams.includes(m.teamA) || p.favoriteTeams.includes(m.teamB);
  return !inWindow && (involvesFav || isMarquee);
}
