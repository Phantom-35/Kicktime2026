import type { RuntimeMatch } from "@/store/match-store";

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
