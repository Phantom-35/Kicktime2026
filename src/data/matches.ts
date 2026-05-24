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

// All matches are scheduled — the tournament hasn't started yet.
// UTC times are spread across morning / afternoon / late-night Europe/Berlin
// to exercise the timezone/availability engine.
export const MATCHES: Match[] = [
  {
    id: "m1", teamA: "MEX", teamB: "RSA", group: "A",
    stadium: "Estadio Azteca", city: "Mexiko-Stadt", hostCountry: "MEX",
    utcTimestamp: "2026-06-11T23:00:00Z", // 01:00 DE (Eröffnung, Nacht)
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "0 km Heimspiel", travelDistanceTeamB: "14.500 km Flug",
    weatherForecast: "21°C, Mild",
  },
  {
    id: "m2", teamA: "USA", teamB: "PAR", group: "D",
    stadium: "SoFi Stadium", city: "Los Angeles", hostCountry: "USA",
    utcTimestamp: "2026-06-13T20:00:00Z", // 22:00 DE
    broadcaster: "MagentaTV", status: "scheduled",
    travelDistanceTeamA: "4.200 km Flug", travelDistanceTeamB: "8.900 km Flug",
    weatherForecast: "26°C, Sonnig",
  },
  {
    id: "m3", teamA: "BRA", teamB: "MAR", group: "C",
    stadium: "Hard Rock Stadium", city: "Miami", hostCountry: "USA",
    utcTimestamp: "2026-06-14T19:00:00Z", // 21:00 DE
    broadcaster: "ZDF", status: "scheduled",
    travelDistanceTeamA: "7.000 km Flug", travelDistanceTeamB: "7.300 km Flug",
    weatherForecast: "32°C, Schwül",
  },
  {
    id: "m4", teamA: "GER", teamB: "CUW", group: "E",
    stadium: "MetLife Stadium", city: "New York", hostCountry: "USA",
    utcTimestamp: "2026-06-14T22:00:00Z", // 00:00 DE
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "6.200 km Flug", travelDistanceTeamB: "3.100 km Flug",
    weatherForecast: "26°C, Klar",
  },
  {
    id: "m5", teamA: "NED", teamB: "JPN", group: "F",
    stadium: "BMO Field", city: "Toronto", hostCountry: "CAN",
    utcTimestamp: "2026-06-14T16:00:00Z", // 18:00 DE
    broadcaster: "MagentaTV", status: "scheduled",
    travelDistanceTeamA: "6.300 km Flug", travelDistanceTeamB: "10.400 km Flug",
    weatherForecast: "22°C, Bewölkt",
  },
  {
    id: "m6", teamA: "ESP", teamB: "CPV", group: "H",
    stadium: "AT&T Stadium", city: "Dallas", hostCountry: "USA",
    utcTimestamp: "2026-06-15T18:00:00Z", // 20:00 DE
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "8.000 km Flug", travelDistanceTeamB: "7.100 km Flug",
    weatherForecast: "34°C, Sonnig",
  },
  {
    id: "m7", teamA: "FRA", teamB: "SEN", group: "I",
    stadium: "Mercedes-Benz Stadium", city: "Atlanta", hostCountry: "USA",
    utcTimestamp: "2026-06-16T13:00:00Z", // 15:00 DE (Nachmittag)
    broadcaster: "ZDF", status: "scheduled",
    travelDistanceTeamA: "7.100 km Flug", travelDistanceTeamB: "7.900 km Flug",
    weatherForecast: "29°C, Gewitter möglich",
  },
  {
    id: "m8", teamA: "POR", teamB: "COD", group: "K",
    stadium: "Levi's Stadium", city: "San Francisco", hostCountry: "USA",
    utcTimestamp: "2026-06-17T03:00:00Z", // 05:00 DE (tiefe Nacht)
    broadcaster: "ARD", status: "scheduled",
    travelDistanceTeamA: "9.200 km Flug", travelDistanceTeamB: "13.000 km Flug",
    weatherForecast: "20°C, Nebel",
  },
  {
    id: "m9", teamA: "ENG", teamB: "CRO", group: "L",
    stadium: "Gillette Stadium", city: "Boston", hostCountry: "USA",
    utcTimestamp: "2026-06-17T18:00:00Z", // 20:00 DE
    broadcaster: "MagentaTV", status: "scheduled",
    travelDistanceTeamA: "5.300 km Flug", travelDistanceTeamB: "6.700 km Flug",
    weatherForecast: "25°C, Sonnig",
  },
  {
    id: "m10", teamA: "ARG", teamB: "ALG", group: "J",
    stadium: "Arrowhead Stadium", city: "Kansas City", hostCountry: "USA",
    utcTimestamp: "2026-06-17T22:00:00Z", // 00:00 DE
    broadcaster: "ZDF", status: "scheduled",
    travelDistanceTeamA: "8.400 km Flug", travelDistanceTeamB: "8.100 km Flug",
    weatherForecast: "31°C, Schwül",
  },
];
