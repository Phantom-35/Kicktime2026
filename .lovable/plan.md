## Ziel

Statischer offizieller WM-2026-Spielplan als JSON in der App, Edge-Function nur noch für Live-Scores. Robuste EN→DE-Übersetzungsschicht, Store seedet aus JSON, Live-Polling matcht per Team-Mapping und triggert Tabellen-Neuberechnung.

---

## 1. Statisches Schedule-JSON

**Neu:** `src/data/world_cup_2026_schedule.json` — alle 104 Spiele (72 Gruppenphase + 32 KO).

Schema pro Eintrag:
```json
{
  "id": "m-001",
  "teamA": "NED", "teamB": "JPN",
  "group": "F",
  "stage": "group",
  "stadium": "MetLife Stadium",
  "city": "New York",
  "hostCountry": "USA",
  "utcTimestamp": "2026-06-18T20:00:00Z",
  "broadcaster": "MagentaTV",
  "travelInfo": "Airport: EWR/JFK, Transit: NJ Transit",
  "weatherForecast": "Schwül, 28°C"
}
```

- Gruppenphase deckt alle 12 Gruppen A–L × 6 Spiele = 72 Matches ab.
- KO-Phase (Round of 32, R16, QF, SF, 3rd-place, Final) mit Platzhalter-Codes (`"W-A1"`, `"R32-1"`) + finalem Venue/Datum.
- Realistische Verteilung über offizielle Host Cities (16 Städte: USA 11, MEX 3, CAN 2) mit passenden Stadien.
- Broadcaster-Verteilung: ARD/ZDF wechselnd für Free-TV-Highlights, MagentaTV für den Rest (alle 104 Spiele).
- Travel & Weather pro Host-City zentral kuratiert (z. B. Miami: "Tropisch, 32°C"; Vancouver: "Mild, 22°C"; Mexiko-Stadt: "Mild, 21°C, dünne Luft").

> **Hinweis Genauigkeit:** Der offizielle FIFA-Spielplan ist bekannt (Match-Zeiten/Venues seit Feb 2024 veröffentlicht). Teilnehmer pro Slot werden teils erst nach Qualifikation final — wir verwenden die aktuell bekannten Qualifikanten/Top-Seeds und markieren noch offene Slots klar (z. B. `"AFC-PO1"`). Live-Matching per API-Fixture-ID via Mapping passt das automatisch an, sobald Live-Daten reinkommen.

---

## 2. Team-Mapping-Layer

**Neu:** `src/utils/teamMapping.ts`

```ts
export type TeamMapping = {
  code: string;        // "NED"
  germanName: string;  // "Niederlande"
  aliases: string[];   // ["Netherlands", "Holland"]
};

export const TEAM_MAPPINGS: TeamMapping[] = [ ... 48 Einträge ... ];

// Lookup-Index (lowercase) wird einmal gebaut
export function apiNameToCode(name: string): string | null;
export function codeToGermanName(code: string): string;
```

- Aliase decken bekannte API-Football-Varianten ab: "United States"/"USA", "Netherlands"/"Holland", "Ivory Coast"/"Côte d'Ivoire", "Saudi Arabia"/"KSA", "Korea Republic"/"South Korea", "IR Iran"/"Iran", "Czechia"/"Czech Republic", "Türkiye"/"Turkey", "Cape Verde"/"Cabo Verde" usw.
- Fallback: unbekannter Name → `console.warn("[teamMapping] unmapped:", name)` und Rückgabe `null`; aufrufender Code überspringt das Fixture, App bleibt stabil.
- `src/data/teams.ts` wird mit `germanName` aus dem Mapping rückwärts-validiert (Build-Time-Konsistenz-Check als Kommentar/Test, kein Hard-Fail).

---

## 3. Store seeded aus JSON

`src/store/match-store.ts` Änderungen:

- `import schedule from "@/data/world_cup_2026_schedule.json"` (TanStack/Vite unterstützt JSON-Imports nativ).
- `seed()` mappt JSON-Einträge → `RuntimeMatch` (`status: "scheduled"`).
- `MATCHES`-Array in `src/data/matches.ts` entfällt; `Match`-Typ bleibt exportiert und wird angepasst:
  - Neue Felder: `stage`, optional `travelInfo` (ersetzt die zwei `travelDistanceTeamA/B`-Felder, weil API/JSON keine Distanzen liefern und das UI eh nur Travel-Tipp anzeigt).
- `getLocalParts(utcTimestamp, "Europe/Berlin")` bleibt unverändert — JSON-UTC fließt unverändert durch, NED vs JPN 20:00Z = 22:00 Berlin (CEST) ✔.
- `MatchCard` und `MatchDetailSheet` lesen weiter aus Store/`Match`-Typ; minimaler UI-Patch: `travelDistanceTeamA/B` → `travelInfo` (an den 1–2 Stellen, wo sie heute gerendert werden — Detail-Sheet).

---

## 4. Live-API-Polling via Team-Mapping

`src/services/footballApi.ts`:

- `normalize()` nutzt `apiNameToCode()` aus dem neuen Mapping (ersetzt lokalen `nameIndex`).
- `applyLiveFixturesToStore()`:
  1. Übersetzt eingehende EN-Namen → Codes (oder skip + warn).
  2. Findet Match im Store via `(teamA, teamB)`-Paar (richtungsunabhängig).
  3. Ruft `applyLiveUpdate(id, { liveScore, matchMinute, status })` auf.
  4. Bei `status === "finished"` zusätzlich `finishMatch(id, finalScore)`, damit `score` final gesetzt wird.
- Tabellen: `calculateTableStandings` in `src/lib/standings.ts` liest bereits aus Store-Matches + `liveScores` — wird durch Zustand-Subscription automatisch reaktiv aktualisiert (kein Code-Change nötig).
- `useLiveApi.ts` Polling-Loop bleibt strukturell gleich; nur die Mapping-Quelle ändert sich.

---

## 5. Edge-Function

Keine Änderung. `fetch-live-scores` bleibt mit `?live=all` (während WM relevant — vorher Dev-Simulator). Optional: `?league=1&season=2026&live=all` für Pre-Filter — aber `live=all` ist robuster gegenüber Saison-Mapping-Drift in der API.

---

## 6. Cleanup & Verifikation

- `MATCHES`-Array löschen, alle Imports umstellen (Store ist Single Source of Truth).
- Lokaler `nameIndex` aus `footballApi.ts` raus.
- TypeScript-Build muss grün sein.
- Manuelle Checks im Preview:
  - Spiele-Tab zeigt 104 Einträge, gruppiert, korrekte Berlin-Zeiten.
  - NED vs JPN: 18.06.2026, 22:00 Uhr, MetLife Stadium, MagentaTV ✔.
  - Tabellen-Tab: alle 12 Gruppen sichtbar, 0:0:0.
  - Detail-Sheet zeigt Travel-Info + Wetter.
  - Dev-Simulator (Profil) triggert Live-Status + Tabellen-Update.

---

## Risiken

- **Spielplan-Genauigkeit:** Einige Teilnehmer (interkontinentale Playoffs) stehen noch nicht final fest. JSON markiert diese Slots explizit, Live-Matching pro Fixture-ID-Äquivalent (Team-Paar) korrigiert sich automatisch sobald die API echte Namen liefert.
- **JSON-Größe:** ~104 Einträge × ~250 B ≈ 30 KB — unkritisch im Bundle.
- **Mapping-Lücken:** Werden als Warnings sichtbar, App crasht nicht.
