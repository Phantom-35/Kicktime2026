/**
 * v7.6.0 — Hardgecodete Paarungen für das Sechzehntelfinale (R32).
 *
 * Diese Tabelle ist die alleinige Wahrheit für die R32-Runde und überschreibt
 * zur Laufzeit Teams, Stadion, Stadt und Anstoßzeit aus dem generischen
 * `world_cup_2026_schedule.json`. Alle Ansichten (Dashboard, Spiele-Tab,
 * Perfect Matches) zeigen damit zwingend die hier hinterlegten Daten an.
 *
 * Achtelfinale (R16) und alle weiteren Runden bleiben absichtlich
 * dynamisch — sie werden komplett über die API / Platzhalter-Auflösung
 * befüllt, sobald die Sieger feststehen.
 *
 * IDs m-073…m-088 entsprechen den 16 R32-Slots im Schedule-JSON.
 */

export type KoStaticEntry = {
  teamA: string;
  teamB: string;
  stadium?: string;
  city?: string;
  utcTimestamp?: string;
};

export const KO_STATIC_OVERRIDES: Record<string, KoStaticEntry> = {
  // Sonntag, 28. Juni 2026
  "m-073": {
    teamA: "RSA",
    teamB: "CAN",
    stadium: "SoFi Stadium",
    city: "Inglewood",
    utcTimestamp: "2026-06-28T20:00:00Z",
  },
  // Montag, 29. Juni 2026
  "m-074": {
    teamA: "BRA",
    teamB: "JPN",
    stadium: "NRG Stadium",
    city: "Houston",
    utcTimestamp: "2026-06-29T17:00:00Z",
  },
  "m-075": {
    teamA: "GER",
    teamB: "PAR",
    stadium: "Gillette Stadium",
    city: "Foxborough",
    utcTimestamp: "2026-06-29T20:30:00Z",
  },
  // Dienstag, 30. Juni 2026 (NED-MAR um 01:00 UTC = noch Nacht zu Montag/Dienstag)
  "m-076": {
    teamA: "NED",
    teamB: "MAR",
    stadium: "Estadio BBVA",
    city: "Monterrey",
    utcTimestamp: "2026-06-30T01:00:00Z",
  },
  "m-077": {
    teamA: "CIV",
    teamB: "NOR",
    stadium: "AT&T Stadium",
    city: "Arlington",
    utcTimestamp: "2026-06-30T17:00:00Z",
  },
  "m-078": {
    teamA: "FRA",
    teamB: "SWE",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    utcTimestamp: "2026-06-30T21:00:00Z",
  },
  // Mittwoch, 1. Juli 2026
  "m-079": {
    teamA: "MEX",
    teamB: "ECU",
    stadium: "Estadio Azteca",
    city: "Mexiko-Stadt",
    utcTimestamp: "2026-07-01T01:00:00Z",
  },
  "m-080": {
    teamA: "ENG",
    teamB: "COD",
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
    utcTimestamp: "2026-07-01T16:00:00Z",
  },
  "m-081": {
    teamA: "BEL",
    teamB: "SEN",
    stadium: "Lumen Field",
    city: "Seattle",
    utcTimestamp: "2026-07-01T20:00:00Z",
  },
  "m-082": {
    teamA: "POR",
    teamB: "CRO",
    stadium: "BMO Field",
    city: "Toronto",
    utcTimestamp: "2026-07-01T23:00:00Z",
  },
  // Donnerstag, 2. Juli 2026 (USA-BIH um 00:00 UTC = Mi-Nacht/Do)
  "m-083": {
    teamA: "USA",
    teamB: "BIH",
    stadium: "Levi's Stadium",
    city: "Santa Clara",
    utcTimestamp: "2026-07-02T00:00:00Z",
  },
  "m-084": {
    teamA: "ESP",
    teamB: "AUT",
    stadium: "SoFi Stadium",
    city: "Inglewood",
    utcTimestamp: "2026-07-02T19:00:00Z",
  },
  // Freitag, 3. Juli 2026
  "m-085": {
    teamA: "SUI",
    teamB: "ALG",
    stadium: "BC Place Stadium",
    city: "Vancouver",
    utcTimestamp: "2026-07-03T03:00:00Z",
  },
  "m-086": {
    teamA: "AUS",
    teamB: "EGY",
    stadium: "AT&T Stadium",
    city: "Arlington",
    utcTimestamp: "2026-07-03T18:00:00Z",
  },
  "m-087": {
    teamA: "ARG",
    teamB: "CPV",
    stadium: "Hard Rock Stadium",
    city: "Miami Gardens",
    utcTimestamp: "2026-07-03T22:00:00Z",
  },
  // Samstag, 4. Juli 2026 (COL-GHA um 01:30 UTC)
  "m-088": {
    teamA: "COL",
    teamB: "GHA",
    stadium: "Arrowhead Stadium",
    city: "Kansas City",
    utcTimestamp: "2026-07-04T01:30:00Z",
  },
};
