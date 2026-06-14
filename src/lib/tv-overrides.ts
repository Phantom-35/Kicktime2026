/**
 * TV broadcaster overrides driven by `wm2026_uebertragung.json` (sportschau.de).
 *
 * - Group stage: lookup by team-pair (order-independent).
 * - Knockout stage: lookup by FIFA match number (`match` field in schedule JSON
 *   == `spiel_nr` in the source). Currently only the Final has a fixed value (ZDF);
 *   all other KO entries are `null` → no override.
 *
 * `anbieter` value → Broadcaster list:
 *   "ARD" → ["ARD"], "ZDF" → ["ZDF"], "Magenta" → ["MagentaTV"], null → skip.
 */

import type { Broadcaster, Match } from "@/data/matches";
import source from "@/data/wm2026_uebertragung.json";

// German team names (as in source JSON) → internal team codes (src/data/teams.ts)
const NAME_TO_CODE: Record<string, string> = {
  "Mexiko": "MEX",
  "Südafrika": "RSA",
  "Südkorea": "KOR",
  "Tschechien": "CZE",
  "Kanada": "CAN",
  "Bosnien-Herzegowina": "BIH",
  "Katar": "QAT",
  "Schweiz": "SUI",
  "Brasilien": "BRA",
  "Marokko": "MAR",
  "Haiti": "HAI",
  "Schottland": "SCO",
  "USA": "USA",
  "Paraguay": "PAR",
  "Australien": "AUS",
  "Türkei": "TUR",
  "Deutschland": "GER",
  "Curaçao": "CUW",
  "Elfenbeinküste": "CIV",
  "Ecuador": "ECU",
  "Niederlande": "NED",
  "Japan": "JPN",
  "Schweden": "SWE",
  "Tunesien": "TUN",
  "Belgien": "BEL",
  "Ägypten": "EGY",
  "Iran": "IRN",
  "Neuseeland": "NZL",
  "Spanien": "ESP",
  "Kap Verde": "CPV",
  "Saudi-Arabien": "KSA",
  "Uruguay": "URU",
  "Frankreich": "FRA",
  "Senegal": "SEN",
  "Irak": "IRQ",
  "Norwegen": "NOR",
  "Argentinien": "ARG",
  "Algerien": "ALG",
  "Österreich": "AUT",
  "Jordanien": "JOR",
  "Portugal": "POR",
  "DR Kongo": "COD",
  "Usbekistan": "UZB",
  "Kolumbien": "COL",
  "England": "ENG",
  "Kroatien": "CRO",
  "Ghana": "GHA",
  "Panama": "PAN",
};

function providerToList(p: unknown): Broadcaster[] | null {
  if (p === "ARD") return ["ARD"];
  if (p === "ZDF") return ["ZDF"];
  if (p === "Magenta" || p === "MagentaTV") return ["MagentaTV"];
  return null;
}

function keyFor(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function pickPrimary(list: Broadcaster[]): Broadcaster {
  if (list.includes("ARD")) return "ARD";
  if (list.includes("ZDF")) return "ZDF";
  return list[0] ?? "MagentaTV";
}

type GroupEntry = { heim: string; gast: string; anbieter: string | null };
type KoEntry = { spiel_nr: number; anbieter: string | null };

const GROUP_MAP = new Map<string, Broadcaster[]>();
const KO_MAP = new Map<number, Broadcaster[]>();

(function buildMaps() {
  const src = source as {
    vorrunde: Record<string, GroupEntry[]>;
    ko_phase: Record<string, KoEntry[]>;
  };

  for (const day of Object.values(src.vorrunde)) {
    for (const m of day) {
      const list = providerToList(m.anbieter);
      if (!list) continue;
      const a = NAME_TO_CODE[m.heim];
      const b = NAME_TO_CODE[m.gast];
      if (!a || !b) {
        console.warn("[tv-overrides] unknown team name:", m.heim, m.gast);
        continue;
      }
      GROUP_MAP.set(keyFor(a, b), list);
    }
  }

  for (const round of Object.values(src.ko_phase)) {
    for (const m of round) {
      const list = providerToList(m.anbieter);
      if (!list) continue;
      KO_MAP.set(m.spiel_nr, list);
    }
  }
})();

export function applyTvOverride<T extends Match & { match?: number }>(match: T): T {
  let broadcasters: Broadcaster[] | undefined;

  if (match.stage === "group") {
    broadcasters = GROUP_MAP.get(keyFor(match.teamA, match.teamB));
  } else if (typeof match.match === "number") {
    broadcasters = KO_MAP.get(match.match);
  }

  if (!broadcasters || broadcasters.length === 0) return match;

  return {
    ...match,
    broadcaster: pickPrimary(broadcasters),
    broadcasters,
  };
}
