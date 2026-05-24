import { MATCHES, type Match } from "@/data/matches";
import { getTeam } from "@/data/teams";
import { matchInAvailability } from "./time";
import type { Window } from "@/store/app-store";

export type Categorized = {
  perfect: Match[];
  nightShift: Match[];
  missed: Match[];
};

type Params = {
  favoriteTeams: string[];
  interestingTeams: string[];
  availability: { weekday: Window; weekend: Window };
  userTimezone: string;
};

const NOW = new Date("2026-06-10T12:00:00Z").getTime();

export function categorizeMatches(p: Params): Categorized {
  const perfect: Match[] = [];
  const nightShift: Match[] = [];
  const missed: Match[] = [];

  for (const m of MATCHES) {
    const involvesFav =
      p.favoriteTeams.includes(m.teamA) || p.favoriteTeams.includes(m.teamB);
    const involvesInt =
      p.interestingTeams.includes(m.teamA) || p.interestingTeams.includes(m.teamB);
    const involvesAny = involvesFav || involvesInt;
    const isMarquee =
      getTeam(m.teamA).tier === 1 && getTeam(m.teamB).tier === 1;
    const inWindow = matchInAvailability(m.utcTimestamp, p.userTimezone, p.availability);
    const kickoff = new Date(m.utcTimestamp).getTime();
    const isPast = kickoff < NOW || m.status === "finished";

    if (isPast) {
      if (involvesAny) missed.push(m);
      continue;
    }
    if (involvesAny && inWindow) {
      perfect.push(m);
    } else if ((involvesFav || isMarquee) && !inWindow) {
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

export function isPerfectFor(m: Match, p: Params) {
  const involvesAny =
    p.favoriteTeams.includes(m.teamA) || p.favoriteTeams.includes(m.teamB) ||
    p.interestingTeams.includes(m.teamA) || p.interestingTeams.includes(m.teamB);
  return involvesAny && matchInAvailability(m.utcTimestamp, p.userTimezone, p.availability);
}

export function isNightShift(m: Match, p: Params) {
  const inWindow = matchInAvailability(m.utcTimestamp, p.userTimezone, p.availability);
  const isMarquee = getTeam(m.teamA).tier === 1 && getTeam(m.teamB).tier === 1;
  const involvesFav = p.favoriteTeams.includes(m.teamA) || p.favoriteTeams.includes(m.teamB);
  return !inWindow && (involvesFav || isMarquee);
}
