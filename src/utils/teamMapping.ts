/**
 * EN → DE / code mapping layer between API-Football and our internal team codes.
 *
 * The live data pipeline calls `apiNameToCode()` for every fixture; unknown
 * names log a warning and return `null` so the app keeps running.
 */

import { TEAMS } from "@/data/teams";

export type TeamMapping = {
  code: string;
  germanName: string;
  /** Lowercase variants the API-Football feed has been observed to use. */
  aliases: string[];
};

export const TEAM_MAPPINGS: TeamMapping[] = [
  // Group A
  { code: "MEX", germanName: "Mexiko", aliases: ["mexico"] },
  { code: "RSA", germanName: "Südafrika", aliases: ["south africa"] },
  { code: "KOR", germanName: "Südkorea", aliases: ["south korea", "korea republic", "republic of korea"] },
  { code: "CZE", germanName: "Tschechien", aliases: ["czech republic", "czechia"] },
  // Group B
  { code: "CAN", germanName: "Kanada", aliases: ["canada"] },
  { code: "BIH", germanName: "Bosnien-Herzegowina", aliases: ["bosnia and herzegovina", "bosnia"] },
  { code: "QAT", germanName: "Katar", aliases: ["qatar"] },
  { code: "SUI", germanName: "Schweiz", aliases: ["switzerland"] },
  // Group C
  { code: "BRA", germanName: "Brasilien", aliases: ["brazil"] },
  { code: "MAR", germanName: "Marokko", aliases: ["morocco"] },
  { code: "HAI", germanName: "Haiti", aliases: ["haiti"] },
  { code: "SCO", germanName: "Schottland", aliases: ["scotland"] },
  // Group D
  { code: "USA", germanName: "USA", aliases: ["united states", "united states of america", "usa"] },
  { code: "PAR", germanName: "Paraguay", aliases: ["paraguay"] },
  { code: "AUS", germanName: "Australien", aliases: ["australia"] },
  { code: "TUR", germanName: "Türkei", aliases: ["turkey", "türkiye", "turkiye"] },
  // Group E
  { code: "GER", germanName: "Deutschland", aliases: ["germany"] },
  { code: "CUW", germanName: "Curaçao", aliases: ["curacao", "curaçao"] },
  { code: "CIV", germanName: "Elfenbeinküste", aliases: ["ivory coast", "côte d'ivoire", "cote d'ivoire"] },
  { code: "ECU", germanName: "Ecuador", aliases: ["ecuador"] },
  // Group F
  { code: "NED", germanName: "Niederlande", aliases: ["netherlands", "holland"] },
  { code: "JPN", germanName: "Japan", aliases: ["japan"] },
  { code: "SWE", germanName: "Schweden", aliases: ["sweden"] },
  { code: "TUN", germanName: "Tunesien", aliases: ["tunisia"] },
  // Group G
  { code: "BEL", germanName: "Belgien", aliases: ["belgium"] },
  { code: "EGY", germanName: "Ägypten", aliases: ["egypt"] },
  { code: "IRN", germanName: "Iran", aliases: ["iran", "ir iran", "islamic republic of iran"] },
  { code: "NZL", germanName: "Neuseeland", aliases: ["new zealand"] },
  // Group H
  { code: "ESP", germanName: "Spanien", aliases: ["spain"] },
  { code: "CPV", germanName: "Kap Verde", aliases: ["cape verde", "cabo verde"] },
  { code: "KSA", germanName: "Saudi-Arabien", aliases: ["saudi arabia", "ksa"] },
  { code: "URU", germanName: "Uruguay", aliases: ["uruguay"] },
  // Group I
  { code: "FRA", germanName: "Frankreich", aliases: ["france"] },
  { code: "SEN", germanName: "Senegal", aliases: ["senegal"] },
  { code: "IRQ", germanName: "Irak", aliases: ["iraq"] },
  { code: "NOR", germanName: "Norwegen", aliases: ["norway"] },
  // Group J
  { code: "ARG", germanName: "Argentinien", aliases: ["argentina"] },
  { code: "ALG", germanName: "Algerien", aliases: ["algeria"] },
  { code: "AUT", germanName: "Österreich", aliases: ["austria"] },
  { code: "JOR", germanName: "Jordanien", aliases: ["jordan"] },
  // Group K
  { code: "POR", germanName: "Portugal", aliases: ["portugal"] },
  { code: "COD", germanName: "DR Kongo", aliases: ["dr congo", "congo dr", "democratic republic of the congo", "congo democratic republic"] },
  { code: "UZB", germanName: "Usbekistan", aliases: ["uzbekistan"] },
  { code: "COL", germanName: "Kolumbien", aliases: ["colombia"] },
  // Group L
  { code: "ENG", germanName: "England", aliases: ["england"] },
  { code: "CRO", germanName: "Kroatien", aliases: ["croatia"] },
  { code: "GHA", germanName: "Ghana", aliases: ["ghana"] },
  { code: "PAN", germanName: "Panama", aliases: ["panama"] },
];

const lookup: Record<string, string> = (() => {
  const idx: Record<string, string> = {};
  for (const m of TEAM_MAPPINGS) {
    idx[m.germanName.toLowerCase()] = m.code;
    idx[m.code.toLowerCase()] = m.code;
    for (const a of m.aliases) idx[a.toLowerCase()] = m.code;
  }
  // Also fold the canonical German names from teams.ts (defensive).
  for (const t of TEAMS) idx[t.name.toLowerCase()] = t.code;
  return idx;
})();

const codeToGerman: Record<string, string> = (() => {
  const idx: Record<string, string> = {};
  for (const m of TEAM_MAPPINGS) idx[m.code] = m.germanName;
  return idx;
})();

/** Map an API team name (English or other) to our internal 3-letter code. */
export function apiNameToCode(name: string | undefined | null): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  const hit = lookup[key];
  if (hit) return hit;
  // Fallback: strip diacritics and retry
  const normalized = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hit2 = lookup[normalized];
  if (hit2) return hit2;
  if (typeof console !== "undefined") {
    console.warn("[teamMapping] unmapped team name from API:", name);
  }
  return null;
}

export function codeToGermanName(code: string): string {
  return codeToGerman[code] ?? code;
}
