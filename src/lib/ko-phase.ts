/**
 * KO-Phasen-Steuerung — welche OpenLigaDB-URL soll die App gerade abfragen?
 *
 * WICHTIG: Sechzehntelfinale (R32) bleibt im Auto-Modus hardgecodet
 * (ko-static.ts). Ab Achtelfinale (R16) fragen wir die passende
 * OpenLigaDB-Runde an und schalten automatisch weiter, sobald ALLE
 * Spiele der aktuellen Runde `matchIsFinished: true` sind.
 *
 * v7.7: Zusätzlich existiert Phase 4 (Sechzehntelfinale) als
 * MANUELLER Admin-Override (System-Tab → /4-Button). Auto-Modus ignoriert
 * /4, damit die hardgecodeten R32-Daten weiter greifen.
 */

import type { RuntimeMatch } from "@/store/match-store";
import { REAL_TEAMS } from "@/data/teams";

const REAL_TEAM_CODES = new Set(REAL_TEAMS.map((t) => t.code));

/**
 * Ist der Team-Code ein Platzhalter (kein echter Nationalcode)?
 * Beispiele: "W:m-073|m-074", "L101", "1A", "3C-D-E-F", "A2".
 */
export function isPlaceholderTeam(code: string | undefined | null): boolean {
  if (!code) return true;
  return !REAL_TEAM_CODES.has(code);
}

export type KoPhaseNum = 4 | 5 | 6 | 7 | 8 | 9;

export type KoPhaseInfo = {
  num: KoPhaseNum;
  stage: "r32" | "r16" | "qf" | "sf" | "third" | "final";
  label: string;
  url: string;
};

export const KO_PHASES: Record<KoPhaseNum, KoPhaseInfo> = {
  4: { num: 4, stage: "r32",   label: "Sechzehntelfinale",  url: "https://api.openligadb.de/getmatchdata/wm26/2026/4" },
  5: { num: 5, stage: "r16",   label: "Achtelfinale",       url: "https://api.openligadb.de/getmatchdata/wm26/2026/5" },
  6: { num: 6, stage: "qf",    label: "Viertelfinale",      url: "https://api.openligadb.de/getmatchdata/wm26/2026/6" },
  7: { num: 7, stage: "sf",    label: "Halbfinale",         url: "https://api.openligadb.de/getmatchdata/wm26/2026/7" },
  8: { num: 8, stage: "third", label: "Spiel um Platz 3",   url: "https://api.openligadb.de/getmatchdata/wm26/2026/8" },
  9: { num: 9, stage: "final", label: "Finale",             url: "https://api.openligadb.de/getmatchdata/wm26/2026/9" },
};

export const KO_PHASE_LIST: KoPhaseInfo[] = [
  KO_PHASES[4],
  KO_PHASES[5],
  KO_PHASES[6],
  KO_PHASES[7],
  KO_PHASES[8],
  KO_PHASES[9],
];

/**
 * Bestimmt automatisch die aktuelle KO-Phase.
 * - null = noch keine KO-API nötig (R32 hardgecodet läuft noch)
 * - Sonst: Erste Runde ab R16, die entweder noch nicht geladen wurde oder
 *   noch unbeendete Spiele hat.
 *
 * WICHTIG: Auto liefert NIE Phase 4 zurück — /4 ist nur als manueller
 * Backup-Override im Admin-Panel gedacht.
 */
export function determineActiveKoPhase(matches: RuntimeMatch[]): KoPhaseNum | null {
  const r32 = matches.filter((m) => m.stage === "r32");
  if (r32.length > 0 && r32.some((m) => m.status !== "finished")) return null;

  for (const info of KO_PHASE_LIST) {
    if (info.num === 4) continue; // Auto überspringt /4
    const list = matches.filter((m) => m.stage === info.stage);
    if (list.length === 0) return info.num;
    if (list.some((m) => m.status !== "finished")) return info.num;
  }
  return 9;
}

export function getKoPhaseInfo(num: KoPhaseNum | null): KoPhaseInfo | null {
  if (num == null) return null;
  return KO_PHASES[num] ?? null;
}

/**
 * Liefert die nächste KO-Phase, deren Slots noch Platzhalter-Teams enthalten
 * — als Prefetch-Kandidat, um Bracket-Slots automatisch aufzulösen, sobald
 * die API die echten Sieger liefert. Gibt null zurück, wenn nichts zu tun ist.
 */
export function getNextPhaseForBracketPrefetch(
  matches: RuntimeMatch[],
  activePhase: KoPhaseNum | null,
): KoPhaseNum | null {
  for (const info of KO_PHASE_LIST) {
    if (info.num === 4) continue; // R32 ist hardgecodet
    if (activePhase != null && info.num <= activePhase) continue;
    const list = matches.filter((m) => m.stage === info.stage);
    if (list.length === 0) return info.num;
    const hasPlaceholder = list.some(
      (m) => isPlaceholderTeam(m.teamA) || isPlaceholderTeam(m.teamB),
    );
    if (hasPlaceholder) return info.num;
  }
  return null;
}
