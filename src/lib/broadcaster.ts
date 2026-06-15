import type { Broadcaster, Match } from "@/data/matches";

/**
 * Returns the list of broadcasters for a match, normalized so ARD and ZDF
 * never both appear (a match airs on either ARD OR ZDF in free TV).
 * MagentaTV holds full rights to every WM 2026 match and is ALWAYS included.
 * Order: MagentaTV first (Pay-TV, always), then Free-TV (ARD or ZDF) if applicable.
 */
export function getBroadcastersForMatch(match: Match): Broadcaster[] {
  const raw = match.broadcasters ?? [match.broadcaster];
  const unique = Array.from(new Set(raw));
  const freeTv = unique.find((b) => b === "ARD" || b === "ZDF");
  const out: Broadcaster[] = ["MagentaTV"];
  if (freeTv) out.push(freeTv);
  return out;
}

export function freeTvBroadcaster(match: Match): Broadcaster | null {
  const list = match.broadcasters ?? [match.broadcaster];
  return (list.find((b) => b === "ARD" || b === "ZDF") as Broadcaster | undefined) ?? null;
}

export function hasAnyFreeTv(match: Match): boolean {
  const list = match.broadcasters ?? [match.broadcaster];
  return list.some((b) => b === "ARD" || b === "ZDF");
}

export function hasMagentaTv(match: Match): boolean {
  const list = match.broadcasters ?? [match.broadcaster];
  return list.includes("MagentaTV");
}
