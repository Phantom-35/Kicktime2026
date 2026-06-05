import type { Match } from "@/data/matches";

/**
 * Tri-state alarm semantics:
 *  - alarms[id] === true  → user explicitly turned the bell ON
 *  - alarms[id] === false → user explicitly turned the bell OFF (overrides auto)
 *  - alarms[id] === undefined → follow auto-favorites logic
 */
export function isAlarmActive(
  match: Pick<Match, "id" | "teamA" | "teamB">,
  alarms: Record<string, boolean | undefined>,
  autoFav: boolean,
  favorites: string[]
): boolean {
  const explicit = alarms[match.id];
  if (explicit === true) return true;
  if (explicit === false) return false;
  if (autoFav && (favorites.includes(match.teamA) || favorites.includes(match.teamB))) {
    return true;
  }
  return false;
}

export function isAutoFavoriteMatch(
  match: Pick<Match, "teamA" | "teamB">,
  autoFav: boolean,
  favorites: string[]
): boolean {
  return autoFav && (favorites.includes(match.teamA) || favorites.includes(match.teamB));
}
