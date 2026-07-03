import type { RuntimeMatch } from "@/store/match-store";
import type { MatchStage } from "@/data/matches";

/**
 * Dynamic phase label for a match — replaces the hard "Live 39'" minute
 * display with a coarse, calmer phase indicator.
 */
export function getMatchPhaseLabel(match: Pick<RuntimeMatch, "status" | "matchMinute">): string {
  if (match.status === "finished") return "Beendet";
  if (match.status !== "live") return "";
  const m = match.matchMinute ?? 0;
  // Edge function pins HT to exactly 45 during the 45..59 wall-clock window.
  if (m === 45) return "Halbzeitpause";
  if (m >= 46) return "2. Halbzeit";
  return "1. Halbzeit";
}

const STAGE_LABELS: Record<MatchStage, string> = {
  group: "Gruppenphase",
  r32: "Sechzehntelfinale",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  third: "Spiel um Platz 3",
  final: "Finale",
};

/**
 * Klartext-Label für eine Turnier-Runde. Auch Aliase wie "1/16", "1/8",
 * "QF", "SF", "F" werden auf den kanonischen Namen gemappt — falls die
 * API sie liefert.
 */
export function getStageLabel(stage: string): string {
  if (stage in STAGE_LABELS) return STAGE_LABELS[stage as MatchStage];
  const s = stage.toLowerCase().replace(/\s+/g, "");
  if (s === "1/16" || s === "r32" || s === "sechzehntelfinale") return STAGE_LABELS.r32;
  if (s === "1/8" || s === "r16" || s === "achtelfinale") return STAGE_LABELS.r16;
  if (s === "qf" || s === "1/4" || s === "viertelfinale") return STAGE_LABELS.qf;
  if (s === "sf" || s === "1/2" || s === "halbfinale") return STAGE_LABELS.sf;
  if (s === "third" || s === "3rd" || s === "spielumplatz3") return STAGE_LABELS.third;
  if (s === "f" || s === "final" || s === "finale") return STAGE_LABELS.final;
  return "KO-Runde";
}
