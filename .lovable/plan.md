## Ziel

Die Gastro-Seite (`/bars`) mit den vom User gelieferten echten WM-2026-Locations füllen. Pro Location werden zusätzlich **Spiel**, **Datum/Uhrzeit** und **Atmosphäre** angezeigt. Der "Auf Google Maps anzeigen"-Button bleibt erhalten.

## Änderungen

### 1. `src/data/publicViewingData.ts` — komplett neu befüllen

- `PUBLIC_VIEWING_CITIES` von `["München","Berlin","Hamburg","Köln","Frankfurt"]` → `["Berlin","Köln","Hamburg","München"]` (Frankfurt entfernt, da der User keine FRA-Locations geliefert hat).
- `Venue`-Typ um drei neue Felder erweitern:
  - `atmosphere: string` — Atmosphären-Beschreibung
  - `nextMatch: string` — z. B. `"Deutschland – Elfenbeinküste"`
  - `nextMatchKickoff: string` — ISO/lesbares Datum, z. B. `"2026-06-20T22:00"` + Anzeige `"20.06.2026, 22:00 Uhr"`
- `distanceMock` und `hours` entfernen — der User hat keine echten Werte geliefert, Platzhalter ("1.2 km", "17:00–01:00") wären gelogen. Stattdessen kommt die Spiel-Info-Zeile in den Vordergrund.
- `VenueType` bleibt (`Sportsbar` | `Biergarten` | `Fan Zone / Großbildleinwand`). Jede Location wird sinnvoll typisiert:
  - Berlin: Kulturbrauerei → Fan Zone, Brandenburg Gate → Fan Zone, FC Magnet Bar → Sportsbar, Denk-Mal-Lounge → Sportsbar, Hofbräu Wirtshaus → Sportsbar
  - Köln: Joe Champs → Sportsbar, Rhein Roxy → Fan Zone, RheinEnergieSTADION → Fan Zone, Lanxess Arena → Fan Zone, Kaisers → Sportsbar
  - Hamburg: StrandPauli → Biergarten, Spielbudenplatz → Fan Zone, Sky & Sand Beachclub → Biergarten, Stadtpark Open Air → Fan Zone, Volksparkstadion → Fan Zone
  - München: Olympiapark → Fan Zone, Königlicher Hirschgarten → Biergarten, Olympiasee-Brücke → Fan Zone, Munich Airport Public Viewing → Fan Zone, Paulaner am Nockherberg → Biergarten
- Alle 20 Locations mit Adresse, `googleMapsUrl` (Search-Query auf Name + Stadt) und den drei neuen Feldern befüllen.

### 2. `src/routes/bars.tsx` — Anzeige anpassen

- Die existierende "Nächstes Match in Stadt"-Logik (zieht aus `useMatchStore`) durch die location-eigenen `nextMatch` + `nextMatchKickoff`-Felder ersetzen — sie sind pro Location identisch, aber so wie vom User vorgegeben.
- Pro Karte rendern:
  - Name + Typ-Badge (bleibt)
  - Adresse mit `MapPin` (bleibt)
  - **Neu**: "Atmosphäre"-Block mit kurzem Beschreibungstext
  - **Neu**: "Nächstes Spiel"-Block mit Match + Datum/Uhrzeit (ersetzt die alte `nextLine`-Box)
  - "Auf Google Maps anzeigen"-Button (unverändert)
- `distanceMock`- und `hours`-Anzeigen (Badge oben rechts + Clock-Zeile) entfernen, da die Felder wegfallen.
- Default-Stadt von `"München"` auf `"Berlin"` belassen oder bei `"München"` lassen — bleibt München (häufigste Startwahl).
- Imports: ungenutzte `Clock`-Icon-Import entfernen; `useMatchStore`/`selectMatchList`/`getTeam`/`getLocalParts` entfernen, da nicht mehr benötigt.

### 3. Versions-Bump

- `APP_VERSION` in `src/routes/profil.tsx` von `"3.1.5"` → `"3.1.6"`.

## Hinweise

- Frankfurt fällt komplett weg, weil der User keine Frankfurter Locations geliefert hat. Falls Frankfurt erhalten bleiben soll, bitte kurz Bescheid geben.
- Datum/Uhrzeit wird genau so angezeigt wie geliefert (`20.06.2026, 22:00 Uhr` bzw. `09.07.2026, 22:00 Uhr` für das Hofbräu Wirtshaus Viertelfinale). Es findet keine dynamische Verknüpfung mit dem Match-Store statt — die Angaben kommen direkt aus den Location-Daten.
