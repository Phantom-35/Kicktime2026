/**
 * Hardcoded TV broadcaster overrides for the FIFA 2026 schedule.
 *
 * Applied on top of `world_cup_2026_schedule.json` in the match store
 * seed so all consumers (MatchCard, MatchDetailSheet, filters etc.)
 * automatically see the curated ARD/ZDF/MagentaTV mapping.
 *
 * Knockout logic (auto):
 *  - Final: ZDF
 *  - Any KO match involving GER: ARD + ZDF
 *  - All other KO matches: ARD + ZDF (free TV default)
 */

import type { Broadcaster, Match } from "@/data/matches";

type Pair = [string, string];

const GROUP_OVERRIDES: Array<{ pair: Pair; broadcasters: Broadcaster[] }> = [
  { pair: ["MEX", "RSA"], broadcasters: ["ZDF"] },
  { pair: ["KOR", "CZE"], broadcasters: ["ARD", "ZDF"] },
  { pair: ["CAN", "BIH"], broadcasters: ["ARD"] },
  { pair: ["QAT", "SUI"], broadcasters: ["ZDF"] },
  { pair: ["BRA", "MAR"], broadcasters: ["ZDF"] },
  { pair: ["HAI", "SCO"], broadcasters: ["ARD"] },
  { pair: ["GER", "CUW"], broadcasters: ["ARD"] },
  { pair: ["FRA", "SEN"], broadcasters: ["MagentaTV"] },
  { pair: ["CZE", "RSA"], broadcasters: ["ARD", "ZDF"] },
  { pair: ["MEX", "KOR"], broadcasters: ["ARD", "ZDF"] },
  { pair: ["GER", "CIV"], broadcasters: ["ZDF"] },
  { pair: ["ECU", "CUW"], broadcasters: ["ARD", "ZDF"] },
  { pair: ["CZE", "MEX"], broadcasters: ["ARD", "ZDF"] },
  { pair: ["RSA", "KOR"], broadcasters: ["ARD", "ZDF"] },
  { pair: ["ECU", "GER"], broadcasters: ["ARD"] },
  { pair: ["CUW", "CIV"], broadcasters: ["MagentaTV"] },
];

function keyFor(a: string, b: string): string {
  return [a, b].sort().join("|");
}

const GROUP_MAP: Map<string, Broadcaster[]> = new Map(
  GROUP_OVERRIDES.map((o) => [keyFor(o.pair[0], o.pair[1]), o.broadcasters])
);

function pickPrimary(list: Broadcaster[]): Broadcaster {
  if (list.includes("ARD")) return "ARD";
  if (list.includes("ZDF")) return "ZDF";
  return list[0] ?? "MagentaTV";
}

export function applyTvOverride<T extends Match>(match: T): T {
  let broadcasters: Broadcaster[] | undefined;

  if (match.stage === "group") {
    broadcasters = GROUP_MAP.get(keyFor(match.teamA, match.teamB));
  } else {
    // Knockout rounds (r32, r16, qf, sf, third, final)
    if (match.stage === "final") {
      broadcasters = ["ZDF"];
    } else if (match.teamA === "GER" || match.teamB === "GER") {
      broadcasters = ["ARD", "ZDF"];
    } else {
      broadcasters = ["ARD", "ZDF"];
    }
  }

  if (!broadcasters || broadcasters.length === 0) return match;

  return {
    ...match,
    broadcaster: pickPrimary(broadcasters),
    broadcasters,
  };
}
