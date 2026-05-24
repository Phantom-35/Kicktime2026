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

// Static mock standings per group
const MOCK_STATS: Record<string, Partial<StandingRow>> = {
  GER: { played: 2, wins: 2, draws: 0, losses: 0, gf: 4, ga: 1, pts: 6 },
  MEX: { played: 2, wins: 1, draws: 0, losses: 1, gf: 3, ga: 3, pts: 3 },
  USA: { played: 2, wins: 1, draws: 1, losses: 0, gf: 3, ga: 1, pts: 4 },
  CAN: { played: 2, wins: 0, draws: 1, losses: 1, gf: 1, ga: 3, pts: 1 },
  FRA: { played: 2, wins: 1, draws: 1, losses: 0, gf: 4, ga: 2, pts: 4 },
  JPN: { played: 2, wins: 1, draws: 1, losses: 0, gf: 3, ga: 2, pts: 4 },
  ARG: { played: 2, wins: 2, draws: 0, losses: 0, gf: 5, ga: 1, pts: 6 },
  MAR: { played: 2, wins: 0, draws: 1, losses: 1, gf: 1, ga: 4, pts: 1 },
  BRA: { played: 1, wins: 1, draws: 0, losses: 0, gf: 2, ga: 0, pts: 3 },
  CRO: { played: 1, wins: 0, draws: 0, losses: 1, gf: 0, ga: 2, pts: 0 },
  ENG: { played: 2, wins: 1, draws: 1, losses: 0, gf: 3, ga: 1, pts: 4 },
  ITA: { played: 2, wins: 1, draws: 0, losses: 1, gf: 2, ga: 2, pts: 3 },
  ESP: { played: 1, wins: 1, draws: 0, losses: 0, gf: 3, ga: 1, pts: 3 },
  POR: { played: 1, wins: 0, draws: 1, losses: 0, gf: 1, ga: 1, pts: 1 },
  NED: { played: 1, wins: 1, draws: 0, losses: 0, gf: 2, ga: 1, pts: 3 },
  BEL: { played: 1, wins: 0, draws: 0, losses: 1, gf: 1, ga: 2, pts: 0 },
};

export function getGroupStandings(group: string): StandingRow[] {
  return TEAMS.filter((t) => t.group === group)
    .map<StandingRow>((t) => ({
      code: t.code,
      played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0,
      ...MOCK_STATS[t.code],
    }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
}
