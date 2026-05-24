export type Broadcaster = "ARD" | "ZDF" | "MagentaTV";

export type Match = {
  id: string;
  teamA: string;
  teamB: string;
  group: string;
  stadium: string;
  city: string;
  hostCountry: "USA" | "MEX" | "CAN";
  utcTimestamp: string;
  broadcaster: Broadcaster;
  status: "scheduled" | "finished";
  score?: { a: number; b: number };
  travelDistanceTeamA: string;
  travelDistanceTeamB: string;
  weatherForecast: string;
};

// Reference "now" used by the app for demo realism: 2026-06-20T12:00:00Z
// Past matches are before, future after. Mix of kickoff hours.
export const MATCHES: Match[] = [
  // Finished (past) — for missed/recap
  {
    id: "m1", teamA: "GER", teamB: "MEX", group: "A",
    stadium: "MetLife Stadium", city: "New York", hostCountry: "USA",
    utcTimestamp: "2026-06-18T02:00:00Z",
    broadcaster: "ARD", status: "finished", score: { a: 2, b: 1 },
    travelDistanceTeamA: "6.200 km Flug", travelDistanceTeamB: "3.400 km Flug",
    weatherForecast: "26°C, Klar",
  },
  {
    id: "m2", teamA: "FRA", teamB: "JPN", group: "C",
    stadium: "SoFi Stadium", city: "Los Angeles", hostCountry: "USA",
    utcTimestamp: "2026-06-19T03:00:00Z",
    broadcaster: "MagentaTV", status: "finished", score: { a: 1, b: 1 },
    travelDistanceTeamA: "9.100 km Flug", travelDistanceTeamB: "8.800 km Flug",
    weatherForecast: "24°C, Sonnig",
  },
  {
    id: "m3", teamA: "ARG", teamB: "MAR", group: "D",
    stadium: "Estadio Azteca", city: "Mexiko-Stadt", hostCountry: "MEX",
    utcTimestamp: "2026-06-19T22:00:00Z",
    broadcaster: "ZDF", status: "finished", score: { a: 3, b: 0 },
    travelDistanceTeamA: "7.500 km Flug", travelDistanceTeamB: "9.200 km Flug",
    weatherForecast: "21°C, Mild",
  },
  // Upcoming
  {
    id: "m4", teamA: "USA", teamB: "CAN", group: "B",
    stadium: "BMO Field", city: "Toronto", hostCountry: "CAN",
    utcTimestamp: "2026-06-20T18:00:00Z",
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "800 km Flug", travelDistanceTeamB: "0 km Heimspiel",
    weatherForecast: "22°C, Bewölkt",
  },
  {
    id: "m5", teamA: "BRA", teamB: "CRO", group: "E",
    stadium: "Hard Rock Stadium", city: "Miami", hostCountry: "USA",
    utcTimestamp: "2026-06-20T22:00:00Z",
    broadcaster: "MagentaTV", status: "scheduled",
    travelDistanceTeamA: "7.000 km Flug", travelDistanceTeamB: "8.400 km Flug",
    weatherForecast: "32°C, Schwül",
  },
  {
    id: "m6", teamA: "ENG", teamB: "ITA", group: "F",
    stadium: "Mercedes-Benz Stadium", city: "Atlanta", hostCountry: "USA",
    utcTimestamp: "2026-06-21T02:00:00Z",
    broadcaster: "ZDF", status: "scheduled",
    travelDistanceTeamA: "7.100 km Flug", travelDistanceTeamB: "7.900 km Flug",
    weatherForecast: "29°C, Gewitter möglich",
  },
  {
    id: "m7", teamA: "ESP", teamB: "POR", group: "G",
    stadium: "AT&T Stadium", city: "Dallas", hostCountry: "USA",
    utcTimestamp: "2026-06-21T13:00:00Z",
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "8.000 km Flug", travelDistanceTeamB: "8.200 km Flug",
    weatherForecast: "34°C, Sonnig",
  },
  {
    id: "m8", teamA: "NED", teamB: "BEL", group: "H",
    stadium: "Lincoln Financial Field", city: "Philadelphia", hostCountry: "USA",
    utcTimestamp: "2026-06-21T18:00:00Z",
    broadcaster: "MagentaTV", status: "scheduled",
    travelDistanceTeamA: "6.300 km Flug", travelDistanceTeamB: "6.100 km Flug",
    weatherForecast: "27°C, Heiter",
  },
  {
    id: "m9", teamA: "GER", teamB: "USA", group: "A",
    stadium: "Levi's Stadium", city: "San Francisco", hostCountry: "USA",
    utcTimestamp: "2026-06-22T03:00:00Z",
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "9.300 km Flug", travelDistanceTeamB: "4.200 km Flug",
    weatherForecast: "20°C, Nebel",
  },
  {
    id: "m10", teamA: "ARG", teamB: "BRA", group: "D",
    stadium: "Estadio Akron", city: "Guadalajara", hostCountry: "MEX",
    utcTimestamp: "2026-06-22T22:00:00Z",
    broadcaster: "ZDF", status: "scheduled",
    travelDistanceTeamA: "2.200 km Flug", travelDistanceTeamB: "6.700 km Flug",
    weatherForecast: "23°C, Mild",
  },
  {
    id: "m11", teamA: "FRA", teamB: "ENG", group: "C",
    stadium: "Gillette Stadium", city: "Boston", hostCountry: "USA",
    utcTimestamp: "2026-06-23T18:00:00Z",
    broadcaster: "MagentaTV", status: "scheduled",
    travelDistanceTeamA: "5.500 km Flug", travelDistanceTeamB: "5.300 km Flug",
    weatherForecast: "25°C, Sonnig",
  },
  {
    id: "m12", teamA: "MAR", teamB: "CRO", group: "D",
    stadium: "Arrowhead Stadium", city: "Kansas City", hostCountry: "USA",
    utcTimestamp: "2026-06-24T02:00:00Z",
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "8.800 km Flug", travelDistanceTeamB: "8.500 km Flug",
    weatherForecast: "31°C, Schwül",
  },
  {
    id: "m13", teamA: "JPN", teamB: "MEX", group: "A",
    stadium: "Estadio BBVA", city: "Monterrey", hostCountry: "MEX",
    utcTimestamp: "2026-06-24T13:00:00Z",
    broadcaster: "ZDF", status: "scheduled",
    travelDistanceTeamA: "11.000 km Flug", travelDistanceTeamB: "900 km Flug",
    weatherForecast: "33°C, Trocken",
  },
];
