/**
 * KO-Phasen-Steuerung — welche OpenLigaDB-URL soll die App gerade abfragen?
 *
 * WICHTIG: Sechzehntelfinale (R32) bleibt hardgecodet (ko-static.ts).
 * Ab Achtelfinale (R16) fragen wir die passende OpenLigaDB-Runde an
 * und schalten automatisch weiter, sobald ALLE Spiele der aktuellen
 * Runde `matchIsFinished: true` sind.
 */

import type { RuntimeMatch } from "@/store/match-store";

export type KoPhaseNum = 5 | 6 | 7 | 8 | 9;

export type KoPhaseInfo = {
  num: KoPhaseNum;
  stage: "r16" | "qf" | "sf" | "third" | "final";
  label: string;
  url: string;
};

export const KO_PHASES: Record<KoPhaseNum, KoPhaseInfo> = {
  5: { num: 5, stage: "r16",   label: "Achtelfinale",       url: "https://api.openligadb.de/getmatchdata/wm26/2026/5" },
  6: { num: 6, stage: "qf",    label: "Viertelfinale",      url: "https://api.openligadb.de/getmatchdata/wm26/2026/6" },
  7: { num: 7, stage: "sf",    label: "Halbfinale",         url: "https://api.openligadb.de/getmatchdata/wm26/2026/7" },
  8: { num: 8, stage: "third", label: "Spiel um Platz 3",   url: "https://api.openligadb.de/getmatchdata/wm26/2026/8" },
  9: { num: 9, stage: "final", label: "Finale",             url: "https://api.openligadb.de/getmatchdata/wm26/2026/9" },
};

export const KO_PHASE_LIST: KoPhaseInfo[] = [KO_PHASES[5], KO_PHASES[6], KO_PHASES[7], KO_PHASES[8], KO_PHASES[9]];

/**
 * Bestimmt automatisch die aktuelle KO-Phase.
 * - null = noch keine KO-API nötig (R32 hardgecodet läuft noch)
 * - Sonst: Erste Runde, die entweder noch nicht geladen wurde oder
 *   noch unbeendete Spiele hat.
 */
export function determineActiveKoPhase(matches: RuntimeMatch[]): KoPhaseNum | null {
  // R32 hardgecodet → solange dort Spiele nicht beendet sind, keine KO-API abfragen.
  const r32 = matches.filter((m) => m.stage === "r32");
  if (r32.length > 0 && r32.some((m) => m.status !== "finished")) return null;

  for (const info of KO_PHASE_LIST) {
    const list = matches.filter((m) => m.stage === info.stage);
    // Noch nicht geladen? → diese Phase abfragen.
    if (list.length === 0) return info.num;
    // Läuft noch? → diese Phase abfragen.
    if (list.some((m) => m.status !== "finished")) return info.num;
  }
  // Alles durch → weiter auf /9 pollen (schadet nicht).
  return 9;
}

export function getKoPhaseInfo(num: KoPhaseNum | null): KoPhaseInfo | null {
  if (num == null) return null;
  return KO_PHASES[num] ?? null;
}
