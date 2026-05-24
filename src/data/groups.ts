import { TEAMS } from "./teams";

export type StandingRow = {
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  pts: number;
};

// Pre-tournament: no matches played yet, all zeros.
const MOCK_STATS: Record<string, Partial<StandingRow>> = {};

export function getGroupStandings(group: string): StandingRow[] {
  return TEAMS.filter((t) => t.group === group)
    .map<StandingRow>((t) => ({
      code: t.code,
      played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0,
      ...MOCK_STATS[t.code],
    }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
}
