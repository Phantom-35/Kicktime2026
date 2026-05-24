export type Team = {
  code: string;
  name: string;
  flag: string;
  group: string;
  tier: 1 | 2 | 3;
};

// Official 48 nations of the FIFA World Cup 2026 (12 groups of 4).
export const TEAMS: Team[] = [
  // Group A
  { code: "MEX", name: "Mexiko", flag: "🇲🇽", group: "A", tier: 2 },
  { code: "RSA", name: "Südafrika", flag: "🇿🇦", group: "A", tier: 3 },
  { code: "KOR", name: "Südkorea", flag: "🇰🇷", group: "A", tier: 3 },
  { code: "CZE", name: "Tschechien", flag: "🇨🇿", group: "A", tier: 3 },
  // Group B
  { code: "CAN", name: "Kanada", flag: "🇨🇦", group: "B", tier: 3 },
  { code: "BIH", name: "Bosnien-Herzegowina", flag: "🇧🇦", group: "B", tier: 3 },
  { code: "QAT", name: "Katar", flag: "🇶🇦", group: "B", tier: 3 },
  { code: "SUI", name: "Schweiz", flag: "🇨🇭", group: "B", tier: 2 },
  // Group C
  { code: "BRA", name: "Brasilien", flag: "🇧🇷", group: "C", tier: 1 },
  { code: "MAR", name: "Marokko", flag: "🇲🇦", group: "C", tier: 2 },
  { code: "HAI", name: "Haiti", flag: "🇭🇹", group: "C", tier: 3 },
  { code: "SCO", name: "Schottland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", tier: 3 },
  // Group D
  { code: "USA", name: "USA", flag: "🇺🇸", group: "D", tier: 2 },
  { code: "PAR", name: "Paraguay", flag: "🇵🇾", group: "D", tier: 3 },
  { code: "AUS", name: "Australien", flag: "🇦🇺", group: "D", tier: 3 },
  { code: "TUR", name: "Türkei", flag: "🇹🇷", group: "D", tier: 2 },
  // Group E
  { code: "GER", name: "Deutschland", flag: "🇩🇪", group: "E", tier: 1 },
  { code: "CUW", name: "Curaçao", flag: "🇨🇼", group: "E", tier: 3 },
  { code: "CIV", name: "Elfenbeinküste", flag: "🇨🇮", group: "E", tier: 3 },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", group: "E", tier: 3 },
  // Group F
  { code: "NED", name: "Niederlande", flag: "🇳🇱", group: "F", tier: 1 },
  { code: "JPN", name: "Japan", flag: "🇯🇵", group: "F", tier: 2 },
  { code: "SWE", name: "Schweden", flag: "🇸🇪", group: "F", tier: 2 },
  { code: "TUN", name: "Tunesien", flag: "🇹🇳", group: "F", tier: 3 },
  // Group G
  { code: "BEL", name: "Belgien", flag: "🇧🇪", group: "G", tier: 1 },
  { code: "EGY", name: "Ägypten", flag: "🇪🇬", group: "G", tier: 3 },
  { code: "IRN", name: "Iran", flag: "🇮🇷", group: "G", tier: 3 },
  { code: "NZL", name: "Neuseeland", flag: "🇳🇿", group: "G", tier: 3 },
  // Group H
  { code: "ESP", name: "Spanien", flag: "🇪🇸", group: "H", tier: 1 },
  { code: "CPV", name: "Kap Verde", flag: "🇨🇻", group: "H", tier: 3 },
  { code: "KSA", name: "Saudi-Arabien", flag: "🇸🇦", group: "H", tier: 3 },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", group: "H", tier: 2 },
  // Group I
  { code: "FRA", name: "Frankreich", flag: "🇫🇷", group: "I", tier: 1 },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", group: "I", tier: 2 },
  { code: "IRQ", name: "Irak", flag: "🇮🇶", group: "I", tier: 3 },
  { code: "NOR", name: "Norwegen", flag: "🇳🇴", group: "I", tier: 2 },
  // Group J
  { code: "ARG", name: "Argentinien", flag: "🇦🇷", group: "J", tier: 1 },
  { code: "ALG", name: "Algerien", flag: "🇩🇿", group: "J", tier: 3 },
  { code: "AUT", name: "Österreich", flag: "🇦🇹", group: "J", tier: 2 },
  { code: "JOR", name: "Jordanien", flag: "🇯🇴", group: "J", tier: 3 },
  // Group K
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", tier: 1 },
  { code: "COD", name: "DR Kongo", flag: "🇨🇩", group: "K", tier: 3 },
  { code: "UZB", name: "Usbekistan", flag: "🇺🇿", group: "K", tier: 3 },
  { code: "COL", name: "Kolumbien", flag: "🇨🇴", group: "K", tier: 2 },
  // Group L
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", tier: 1 },
  { code: "CRO", name: "Kroatien", flag: "🇭🇷", group: "L", tier: 2 },
  { code: "GHA", name: "Ghana", flag: "🇬🇭", group: "L", tier: 3 },
  { code: "PAN", name: "Panama", flag: "🇵🇦", group: "L", tier: 3 },
];

export const getTeam = (code: string) => TEAMS.find((t) => t.code === code)!;

// Priority order for European football audience — shown first in selectors.
export const PRIORITY_CODES = [
  "GER", "ARG", "BRA", "FRA", "ESP", "ENG", "POR",
  "NED", "CRO", "BEL", "SUI", "AUT", "USA", "MEX",
];

const PRIORITY_INDEX = new Map(PRIORITY_CODES.map((c, i) => [c, i] as const));

export function getSortedTeams(): Team[] {
  const priority = PRIORITY_CODES
    .map((c) => TEAMS.find((t) => t.code === c))
    .filter((t): t is Team => Boolean(t))
    .sort((a, b) => PRIORITY_INDEX.get(a.code)! - PRIORITY_INDEX.get(b.code)!);
  const rest = TEAMS
    .filter((t) => !PRIORITY_INDEX.has(t.code))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  return [...priority, ...rest];
}

export const isPriorityTeam = (code: string) => PRIORITY_INDEX.has(code);
