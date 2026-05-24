export type Team = {
  code: string;
  name: string;
  flag: string;
  group: string;
  tier: 1 | 2 | 3;
};

export const TEAMS: Team[] = [
  { code: "GER", name: "Deutschland", flag: "🇩🇪", group: "A", tier: 1 },
  { code: "MEX", name: "Mexiko", flag: "🇲🇽", group: "A", tier: 2 },
  { code: "USA", name: "USA", flag: "🇺🇸", group: "B", tier: 2 },
  { code: "CAN", name: "Kanada", flag: "🇨🇦", group: "B", tier: 3 },
  { code: "FRA", name: "Frankreich", flag: "🇫🇷", group: "C", tier: 1 },
  { code: "JPN", name: "Japan", flag: "🇯🇵", group: "C", tier: 2 },
  { code: "ARG", name: "Argentinien", flag: "🇦🇷", group: "D", tier: 1 },
  { code: "MAR", name: "Marokko", flag: "🇲🇦", group: "D", tier: 2 },
  { code: "BRA", name: "Brasilien", flag: "🇧🇷", group: "E", tier: 1 },
  { code: "CRO", name: "Kroatien", flag: "🇭🇷", group: "E", tier: 2 },
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "F", tier: 1 },
  { code: "ITA", name: "Italien", flag: "🇮🇹", group: "F", tier: 1 },
  { code: "ESP", name: "Spanien", flag: "🇪🇸", group: "G", tier: 1 },
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "G", tier: 1 },
  { code: "NED", name: "Niederlande", flag: "🇳🇱", group: "H", tier: 2 },
  { code: "BEL", name: "Belgien", flag: "🇧🇪", group: "H", tier: 2 },
];

export const getTeam = (code: string) => TEAMS.find((t) => t.code === code)!;
