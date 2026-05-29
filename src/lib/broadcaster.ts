import type { Broadcaster, Match } from "@/data/matches";

/**
 * Returns the list of broadcasters for a match, normalized so ARD and ZDF
 * never both appear (a match airs on either ARD OR ZDF in free TV).
 * Order: Free-TV first (ARD or ZDF), then MagentaTV (Pay-TV).
 */
export function getBroadcastersForMatch(match: Match): Broadcaster[] {
  const raw = match.broadcasters ?? [match.broadcaster];
  const unique = Array.from(new Set(raw));
  const freeTv = unique.find((b) => b === "ARD" || b === "ZDF");
  const out: Broadcaster[] = [];
  if (freeTv) out.push(freeTv);
  if (unique.includes("MagentaTV")) out.push("MagentaTV");
  return out.length > 0 ? out : unique;
}

export function freeTvBroadcaster(match: Match): Broadcaster | null {
  const list = match.broadcasters ?? [match.broadcaster];
  return (list.find((b) => b === "ARD" || b === "ZDF") as Broadcaster | undefined) ?? null;
}

export function hasMagentaTv(match: Match): boolean {
  const list = match.broadcasters ?? [match.broadcaster];
  return list.includes("MagentaTV");
}
