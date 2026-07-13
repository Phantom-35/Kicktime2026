import { useMemo } from "react";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { REAL_TEAMS, type Team } from "@/data/teams";
import { isPlaceholderTeam } from "@/lib/ko-phase";

export type TournamentWinner = { teamCode: string; team: Team };

export function useTournamentWinner(): TournamentWinner | null {
  const matches = useMatchStore(selectMatchList);
  return useMemo(() => {
    const final = matches.find((m) => m.stage === "final");
    if (!final) return null;
    if (final.status !== "finished") return null;
    const score = final.score ?? final.liveScore;
    if (!score) return null;
    if (score.a === score.b) return null;
    const winnerCode = score.a > score.b ? final.teamA : final.teamB;
    if (!winnerCode || isPlaceholderTeam(winnerCode)) return null;
    const team = REAL_TEAMS.find((t) => t.code === winnerCode);
    if (!team) return null;
    return { teamCode: winnerCode, team };
  }, [matches]);
}
