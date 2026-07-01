/**
 * Turnier-Status-Ermittlung (v7.7).
 *
 * Für jede Nation der WM 2026 wird ermittelt:
 *  - alive: Team ist noch dabei (spielt aktuelle Runde oder ist qualifiziert)
 *  - eliminated + eliminatedIn: Team hat ein KO-Spiel verloren
 *
 * Basis sind der Match-Store (inkl. hardgecodetes R32) und die
 * Gruppentabellenlogik für die Vorrunde.
 */

import type { RuntimeMatch } from "@/store/match-store";
import { REAL_TEAMS, type Team } from "@/data/teams";
import { calculateTableStandings } from "@/lib/standings";

export type EliminatedRound = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export type TeamStatus = {
  team: Team;
  alive: boolean;
  eliminatedIn?: EliminatedRound;
};

const ROUND_LABEL: Record<EliminatedRound, string> = {
  group: "Vorrunde",
  r32: "Sechzehntelfinale",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  third: "Spiel um Platz 3",
  final: "Finale",
};

export function labelForRound(r: EliminatedRound): string {
  return ROUND_LABEL[r];
}

const ROUND_ORDER: EliminatedRound[] = ["final", "third", "sf", "qf", "r16", "r32", "group"];

export function computeTeamStatuses(matches: RuntimeMatch[]): TeamStatus[] {
  const eliminatedIn = new Map<string, EliminatedRound>();

  // 1) Gruppen: Nach vollständigem Abschluss scheiden Platz 3 und 4 aus.
  for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]) {
    const groupMatches = matches.filter((m) => m.stage === "group" && m.group === letter);
    if (groupMatches.length === 0) continue;
    const allDone = groupMatches.every((m) => m.status === "finished" && m.score);
    if (!allDone) continue;
    const standings = calculateTableStandings(letter, groupMatches);
    // FIFA WM 2026: 32 K.o.-Plätze aus 12 Gruppen — Top 2 direkt + 8 beste Gruppendritte.
    // Ohne verlässliche „beste Dritte"-Berechnung markieren wir konservativ nur Platz 4 als raus.
    // Platz 3 bleibt vorerst „alive", bis ein KO-Spiel das Gegenteil beweist.
    for (let i = 3; i < standings.length; i++) {
      const code = standings[i]?.code;
      if (code) eliminatedIn.set(code, "group");
    }
  }

  // 2) KO-Runden: Verlierer eines beendeten Spiels sind raus.
  const koStageToRound: Record<string, EliminatedRound> = {
    r32: "r32",
    r16: "r16",
    qf: "qf",
    sf: "sf",
    third: "third",
    final: "final",
  };
  for (const m of matches) {
    if (m.stage === "group") continue;
    if (m.status !== "finished" || !m.score) continue;
    const round = koStageToRound[m.stage];
    if (!round) continue;
    const { a, b } = m.score;
    if (a === b) continue; // Unentschieden → nach ET/Elfmeter; wir warten auf finalen Score
    const loser = a > b ? m.teamB : m.teamA;
    // KO-Platzhalter (W74, L101, W:X|Y) ignorieren.
    if (/^[WL]:?/.test(loser) || /^[123][A-L]$/.test(loser)) continue;
    const prev = eliminatedIn.get(loser);
    if (!prev || ROUND_ORDER.indexOf(round) < ROUND_ORDER.indexOf(prev)) {
      eliminatedIn.set(loser, round);
    }
  }

  return REAL_TEAMS.map((team) => {
    const round = eliminatedIn.get(team.code);
    return round
      ? { team, alive: false, eliminatedIn: round }
      : { team, alive: true };
  });
}
