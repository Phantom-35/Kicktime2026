/**
 * v7.5.0 — Hardgecodete Achtelfinal- (R32) und Sechzehntelfinale (R16)
 * Paarungen. Diese Tabelle überschreibt zur Laufzeit die generischen
 * Platzhalter aus `world_cup_2026_schedule.json`, damit
 * - die korrekten Teams direkt im UI erscheinen,
 * - Stadien/Städte verlässlich gesetzt sind,
 * - Platzhalter-Pairings ("Sieger Niederlande/Marokko") lesbar bleiben.
 *
 * `teamA` / `teamB` akzeptieren:
 *   - echte Team-Codes ("GER", "BRA", ...) → wirken sofort
 *   - Platzhalter im Format "W:CODE1|CODE2" → wird in getTeam zu
 *     "Sieger {Land1}/{Land2}" mit kombinierter Flagge gerendert.
 */

export type KoStaticEntry = {
  teamA: string;
  teamB: string;
  stadium?: string;
  city?: string;
  utcTimestamp?: string;
};

export const KO_STATIC_OVERRIDES: Record<string, KoStaticEntry> = {
  // ---------- Sechzehntelfinale (R32) ----------
  // 28.06.2026
  "m-073": { teamA: "RSA", teamB: "CAN", stadium: "SoFi Stadium", city: "Inglewood" },
  // 29.06.2026
  "m-074": { teamA: "GER", teamB: "PAR", stadium: "Gillette Stadium", city: "Foxborough" },
  "m-075": { teamA: "NED", teamB: "MAR", stadium: "Estadio BBVA", city: "Monterrey" },
  "m-076": { teamA: "BRA", teamB: "JPN", stadium: "NRG Stadium", city: "Houston" },
  // 30.06.2026 — CIV-NOR ersetzt das alte Arlington-Slot und wandert nach Toronto.
  // Achtung: m-078 wird komplett umgebogen (Stadion, Stadt UND Datum), damit
  // AUS-EGY am 03.07 in Philadelphia stattfindet.
  "m-077": { teamA: "FRA", teamB: "SWE", stadium: "MetLife Stadium", city: "East Rutherford" },
  "m-079": { teamA: "MEX", teamB: "ECU", stadium: "Estadio Azteca", city: "Mexiko-Stadt" },
  // 01.07.2026
  "m-080": { teamA: "BEL", teamB: "SEN", stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  "m-081": { teamA: "USA", teamB: "BIH", stadium: "Levi's Stadium", city: "Santa Clara" },
  // ENG-COD wandert von Seattle nach Vancouver (m-082 -> Vancouver).
  "m-082": { teamA: "ENG", teamB: "COD", stadium: "BC Place", city: "Vancouver" },
  // 02.07.2026
  "m-084": { teamA: "POR", teamB: "CRO", stadium: "SoFi Stadium", city: "Inglewood" },
  // CIV-NOR (Toronto) am 30.06 -> wir nutzen den BMO-Toronto-Slot (m-083),
  // ziehen ihn aber auf den 30.06. heran:
  "m-083": {
    teamA: "CIV",
    teamB: "NOR",
    stadium: "BMO Field",
    city: "Toronto",
    utcTimestamp: "2026-06-30T23:00:00Z",
  },
  "m-085": {
    teamA: "SUI",
    teamB: "ALG",
    stadium: "Lumen Field",
    city: "Seattle",
    utcTimestamp: "2026-07-03T00:00:00Z",
  },
  // 03.07.2026
  "m-086": { teamA: "ESP", teamB: "AUT", stadium: "Hard Rock Stadium", city: "Miami Gardens" },
  "m-087": { teamA: "ARG", teamB: "CPV", stadium: "Arrowhead Stadium", city: "Kansas City" },
  "m-088": { teamA: "COL", teamB: "GHA", stadium: "AT&T Stadium", city: "Arlington" },
  // m-078 wird zum Philadelphia-Spiel umgebogen
  "m-078": {
    teamA: "AUS",
    teamB: "EGY",
    stadium: "Lincoln Financial Field",
    city: "Philadelphia",
    utcTimestamp: "2026-07-04T00:00:00Z",
  },

  // ---------- Achtelfinale (R16) ----------
  // Bekannte Sieger werden direkt eingesetzt, sonst Platzhalter "W:X|Y".
  // 04.07.2026
  "m-089": { teamA: "CAN", teamB: "W:NED|MAR", stadium: "Lincoln Financial Field", city: "Philadelphia" },
  "m-090": { teamA: "W:GER|PAR", teamB: "W:FRA|SWE", stadium: "NRG Stadium", city: "Houston" },
  // 05.07.2026
  "m-091": { teamA: "BRA", teamB: "W:CIV|NOR", stadium: "MetLife Stadium", city: "East Rutherford" },
  "m-092": { teamA: "W:MEX|ECU", teamB: "W:ENG|COD", stadium: "Estadio Azteca", city: "Mexiko-Stadt" },
  // 06.07.2026
  "m-093": { teamA: "W:POR|CRO", teamB: "W:ESP|AUT", stadium: "AT&T Stadium", city: "Arlington" },
  "m-094": { teamA: "W:USA|BIH", teamB: "W:BEL|SEN", stadium: "Lumen Field", city: "Seattle" },
  // 07.07.2026
  "m-095": { teamA: "W:ARG|CPV", teamB: "W:AUS|EGY", stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  "m-096": { teamA: "W:SUI|ALG", teamB: "W:COL|GHA", stadium: "BC Place", city: "Vancouver" },
};
