## Ziel

Die App auf den offiziellen FIFA-Spielplan WM 2026 (PDF v17, 10.04.2026) umstellen — alle 104 Matches (72 Gruppe + 32 KO) mit korrekten Zeiten, Stadien und Teams. Die Uhrzeit jedes Nutzers wird automatisch korrekt angezeigt, inkl. Sommer-/Winterzeit-Umstellung.

## 1. Daten-Extraktion aus dem PDF

Skript (`scripts/parse_fifa_pdf.ts`, einmalig lokal), das das PDF parst und alle 104 Einträge extrahiert:
- Match-Nr., Datum, Uhrzeit (ET), Stadt, Stadion, Teams/Slots, Gruppe, Stage
- Pro Eintrag: `etTimestamp` → `utcTimestamp` via fester ET→UTC-Regel:
  - Juni/Juli 2026: USA-Ostküste = EDT = UTC−4 → **UTC = ET + 4h**.
  - Beispiel: Match 6 Vancouver „00:00 ET" am So 14.06 → `2026-06-14T04:00:00Z` (= Sa 21:00 PT lokal Vancouver). ✔
- KO-Slots als Platzhalter-Codes: `W27`, `W28`, `R32-1`, `R16-1`, `QF1` etc.

Ergebnis: vollständige, regenerierte `src/data/world_cup_2026_schedule.json` (104 Einträge, gleiches Schema wie heute, inkl. `stage`, `matchday`, `hostCountry`, `travelInfo`, `weatherForecast`, `broadcasters`).

## 2. Broadcaster-Regel (unverändert)

- `MagentaTV` auf jedem Match (Pay-TV-Rechte komplett).
- Zusätzlich `ARD` / `ZDF` (alternierend) auf: Eröffnungsspiel, alle GER-Spiele, Halbfinale, Spiel um Platz 3, Finale.

## 3. KO-Phase

Neu im JSON enthalten: 32 KO-Spiele mit Platzhalter-Team-Codes. Sobald die Live-API echte Namen liefert, wird das Match per `(teamA, teamB)`-Mapping oder Match-Nummer im Store korrigiert (Logik existiert bereits in `services/footballApi.ts`).

Anpassung Frontend:
- `src/data/teams.ts`: KO-Platzhalter-Codes (`W27`, `R16-1`, …) als `isPlaceholder: true` mit Labels wie „Sieger Spiel 27" / „Achtelfinalist 1" ergänzen → werden in `Spiele`-Liste und Detail-Sheet lesbar.
- `getTeam()` fällt bei unbekannten Codes weich auf den Platzhalter-Namen zurück.

## 4. Zeitzonen-Logik (Sommer-/Winterzeit-sicher)

Bereits korrekt: `src/lib/time.ts` nutzt `Intl.DateTimeFormat` ohne `timeZone`-Override → der Browser/das OS rechnet die UTC-`Z`-Stempel automatisch in die Nutzer-Zone inkl. DST um. Für Deutschland: Juni/Juli = CEST = UTC+2.

Verifikation (Smoke-Tests im Plan-Skript):
- Eröffnungsspiel MEX vs. Sieger Slot A2, Estadio Azteca, Do 11.06.2026 — laut PDF 19:00 ET → `2026-06-11T23:00:00Z` → Berlin: **Fr 12.06., 01:00 Uhr** (Sommerzeit).
- Finale MetLife Stadium, So 19.07.2026, 15:00 ET → `2026-07-19T19:00:00Z` → Berlin: **21:00 Uhr**.

Kein Code-Change an `time.ts` nötig. Vorhandene `userTimezone`-Reste in `MatchCard` / `MatchDetailSheet` / Routen werden als unbenutzte Argumente belassen (Signatur bleibt rückwärtskompatibel).

## 5. Cleanup & Verifikation

- `world_cup_2026_schedule.json` komplett regeneriert (104 Einträge, kein manuelles Edit).
- Im Preview: Spiele-Tab zeigt 104 Einträge, gruppiert nach lokalem Tag; Tabellen-Tab zeigt 12 Gruppen mit 0:0:0; KO-Phase ist als separate Sektion sichtbar.
- 3 Stichproben gegen das PDF: Match 1 (MEX, Eröffnung), Match 50 (GER-Spiel falls vorhanden), Match 104 (Finale).
- TypeScript-Build grün.

## Technische Details

**ET→UTC Regel (Juni/Juli 2026):**
ET im Juni/Juli ist immer EDT (UTC−4), da die US-DST von März bis November läuft. Es gibt im Turnier-Zeitraum keinen Wechsel — eine einzige `+4h`-Konstante reicht. Die Browser-seitige Rückumrechnung in die Nutzer-Zone übernimmt `Intl` und respektiert sowohl EU-Sommerzeit-Ende (Okt) als auch jede andere Zone weltweit.

**Dateien, die geändert werden:**
- `src/data/world_cup_2026_schedule.json` — vollständig neu generiert (104 Matches)
- `src/data/teams.ts` — KO-Platzhalter ergänzen
- `scripts/parse_fifa_pdf.ts` — neues einmaliges Build-Skript (nicht im App-Bundle)

**Dateien, die unverändert bleiben:**
- `src/lib/time.ts` (bereits DST-korrekt)
- `src/store/match-store.ts`, `src/services/footballApi.ts`, `MatchCard`, `MatchDetailSheet`

## Risiken

- KO-Slot-Namen sind Platzhalter bis Qualifikation/Auslosung final ist — Live-API überschreibt das automatisch.
- Falls das PDF Spalten enthält, die das Parser-Skript nicht sauber liest, fallen einzelne Matches als „?" auf — wir verifizieren nach dem Lauf eine Match-Count-Summe (= 104) und eine pro-Stadt-Summe gegen das PDF.
