export type Team = {
  code: string;
  name: string;
  flag: string;
  group: string;
  tier: 1 | 2 | 3;
};

export const TEAMS: Team[] = [
  // Group A
  { code: "GER", name: "Deutschland", flag: "🇩🇪", group: "A", tier: 1 },
  { code: "MEX", name: "Mexiko", flag: "🇲🇽", group: "A", tier: 2 },
  { code: "SUI", name: "Schweiz", flag: "🇨🇭", group: "A", tier: 2 },
  { code: "KOR", name: "Südkorea", flag: "🇰🇷", group: "A", tier: 3 },
  // Group B
  { code: "USA", name: "USA", flag: "🇺🇸", group: "B", tier: 2 },
  { code: "CAN", name: "Kanada", flag: "🇨🇦", group: "B", tier: 3 },
  { code: "COL", name: "Kolumbien", flag: "🇨🇴", group: "B", tier: 2 },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", group: "B", tier: 3 },
  // Group C
  { code: "FRA", name: "Frankreich", flag: "🇫🇷", group: "C", tier: 1 },
  { code: "JPN", name: "Japan", flag: "🇯🇵", group: "C", tier: 2 },
  { code: "AUS", name: "Australien", flag: "🇦🇺", group: "C", tier: 3 },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", group: "C", tier: 2 },
  // Group D
  { code: "ARG", name: "Argentinien", flag: "🇦🇷", group: "D", tier: 1 },
  { code: "MAR", name: "Marokko", flag: "🇲🇦", group: "D", tier: 2 },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", group: "D", tier: 2 },
  { code: "EGY", name: "Ägypten", flag: "🇪🇬", group: "D", tier: 3 },
  // Group E
  { code: "BRA", name: "Brasilien", flag: "🇧🇷", group: "E", tier: 1 },
  { code: "CRO", name: "Kroatien", flag: "🇭🇷", group: "E", tier: 2 },
  { code: "KSA", name: "Saudi-Arabien", flag: "🇸🇦", group: "E", tier: 3 },
  { code: "NGA", name: "Nigeria", flag: "🇳🇬", group: "E", tier: 3 },
  // Group F
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "F", tier: 1 },
  { code: "ITA", name: "Italien", flag: "🇮🇹", group: "F", tier: 1 },
  { code: "DEN", name: "Dänemark", flag: "🇩🇰", group: "F", tier: 2 },
  { code: "GHA", name: "Ghana", flag: "🇬🇭", group: "F", tier: 3 },
  // Group G
  { code: "ESP", name: "Spanien", flag: "🇪🇸", group: "G", tier: 1 },
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "G", tier: 1 },
  { code: "PAR", name: "Paraguay", flag: "🇵🇾", group: "G", tier: 3 },
  { code: "JAM", name: "Jamaika", flag: "🇯🇲", group: "G", tier: 3 },
  // Group H
  { code: "NED", name: "Niederlande", flag: "🇳🇱", group: "H", tier: 2 },
  { code: "BEL", name: "Belgien", flag: "🇧🇪", group: "H", tier: 2 },
  { code: "AUT", name: "Österreich", flag: "🇦🇹", group: "H", tier: 2 },
  { code: "NOR", name: "Norwegen", flag: "🇳🇴", group: "H", tier: 2 },
  // Group I
  { code: "POL", name: "Polen", flag: "🇵🇱", group: "I", tier: 2 },
  { code: "SCO", name: "Schottland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "I", tier: 3 },
  { code: "IRN", name: "Iran", flag: "🇮🇷", group: "I", tier: 3 },
  { code: "PAN", name: "Panama", flag: "🇵🇦", group: "I", tier: 3 },
  // Group J
  { code: "TUR", name: "Türkei", flag: "🇹🇷", group: "J", tier: 2 },
  { code: "SRB", name: "Serbien", flag: "🇷🇸", group: "J", tier: 2 },
  { code: "CRC", name: "Costa Rica", flag: "🇨🇷", group: "J", tier: 3 },
  { code: "NZL", name: "Neuseeland", flag: "🇳🇿", group: "J", tier: 3 },
  // Group K
  { code: "UKR", name: "Ukraine", flag: "🇺🇦", group: "K", tier: 2 },
  { code: "WAL", name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", group: "K", tier: 3 },
  { code: "TUN", name: "Tunesien", flag: "🇹🇳", group: "K", tier: 3 },
  { code: "CIV", name: "Elfenbeinküste", flag: "🇨🇮", group: "K", tier: 3 },
  // Group L
  { code: "CZE", name: "Tschechien", flag: "🇨🇿", group: "L", tier: 2 },
  { code: "HUN", name: "Ungarn", flag: "🇭🇺", group: "L", tier: 3 },
  { code: "UZB", name: "Usbekistan", flag: "🇺🇿", group: "L", tier: 3 },
  { code: "QAT", name: "Katar", flag: "🇶🇦", group: "L", tier: 3 },
];

export const getTeam = (code: string) => TEAMS.find((t) => t.code === code)!;

// Priority order for European football audience — shown first in selectors.
export const PRIORITY_CODES = [
  "GER", "ITA", "ARG", "BRA", "FRA", "ESP", "ENG", "POR",
  "NED", "CRO", "BEL", "SUI", "AUT", "USA",
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
