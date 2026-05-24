import { TEAMS } from "@/data/teams";
import type { Match } from "@/data/matches";

export type StandingRow = {
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export type LiveScore = { a: number; b: number };
export type LiveScores = Record<string, LiveScore>; // matchId -> live score

/**
 * Pure standings calculator. Combines finished match results with
 * optional live score overrides (in-progress matches). Designed to be
 * swappable with a real sports-API feed later.
 */
export function calculateTableStandings(
  group: string,
  matches: Match[],
  liveScores: LiveScores = {}
): StandingRow[] {
  const teams = TEAMS.filter((t) => t.group === group);
  const rows: Record<string, StandingRow> = {};
  for (const t of teams) {
    rows[t.code] = {
      code: t.code,
      played: 0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, gd: 0, pts: 0,
    };
  }

  for (const m of matches) {
    if (m.group !== group) continue;
    const live = liveScores[m.id];
    const score = live ?? (m.status === "finished" ? m.score : undefined);
    if (!score) continue;
    const a = rows[m.teamA];
    const b = rows[m.teamB];
    if (!a || !b) continue;
    a.played += 1; b.played += 1;
    a.gf += score.a; a.ga += score.b;
    b.gf += score.b; b.ga += score.a;
    if (score.a > score.b) { a.wins += 1; b.losses += 1; a.pts += 3; }
    else if (score.a < score.b) { b.wins += 1; a.losses += 1; b.pts += 3; }
    else { a.draws += 1; b.draws += 1; a.pts += 1; b.pts += 1; }
  }

  return Object.values(rows)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort(
      (x, y) =>
        y.pts - x.pts ||
        y.gd - x.gd ||
        y.gf - x.gf ||
        x.code.localeCompare(y.code)
    );
}

export const GROUP_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;
