# Gastro Tab: Echte Public-Viewing-Daten + UI-Upgrade

## 1. Neue Datendatei `src/data/publicViewingData.ts`

- Exportiert `Venue`-Type und `publicViewingVenues`-Array exakt wie vom User vorgegeben (15 Einträge: München 4, Berlin 3, Hamburg 3, Köln 3, Frankfurt 2).
- Felder: `id, name, city, address, type, distanceMock, hours, googleMapsUrl`.
- `type` ist union: `"Sportsbar" | "Biergarten" | "Fan Zone / Großbildleinwand"`.
- Hamburg wird neu hinzugefügt – die alte `BARS`-Liste in `src/data/bars.ts` kennt Hamburg nicht.

Die alte `src/data/bars.ts` bleibt zunächst bestehen, wird aber von `bars.tsx` nicht mehr verwendet. (Aufräumen optional – wenn keine andere Referenz existiert, löschen.)

## 2. `src/routes/bars.tsx` umbauen

- Import: `publicViewingVenues, Venue` aus der neuen Datendatei.
- Städte-Dropdown: `["München", "Berlin", "Hamburg", "Köln", "Frankfurt"]` (Hamburg ergänzt).
- Umkreis-Filter (`distanceKm`) entfällt, da `distanceMock` jetzt ein String ist. Stattdessen wird der String unverändert als Badge angezeigt (z. B. „1.2 km").
- Filter: nur nach `city`. Der bestehende „Nur Bars mit nächstem Perfect Match"-Switch wird entfernt (matchIds existieren bei den neuen Venues nicht).
- Karten-Layout pro Venue:
  - Header: `name` + rechts oben `distanceMock`-Badge.
  - Adresse-Zeile (MapPin-Icon) + Öffnungszeiten-Zeile (Clock-Icon).
  - **Neuer Type-Badge**: kleines Pill (`bg-primary/10 text-primary`, abhängig vom Typ ggf. unterschiedliche Tönung – Sportsbar = primary, Biergarten = grün, Fan Zone = accent). Premium-Look, abgerundet.
  - **Nächstes Match in dieser Stadt**: ersetzt den "ZEIGT U.A."-Block. 
    - Logik: aus `useMatchStore(selectMatchList)` das nächste `scheduled`/`live` Match filtern, dessen `city` mit `venue.city` übereinstimmt. Falls keines: Fallback „Kein Match in {city} geplant".
    - Format: `📺 Nächstes Match hier: {TeamA} vs. {TeamB} ({DD.MM.} – {HH:mm})` mit `getTeam()` für Flag/Name und `getLocalParts()` für Datum/Zeit.
  - **Primary Button** (volle Breite, ersetzt "Tisch reservieren"):
    - Icon: `MapPin` (oder `Navigation`) + Text „Auf Google Maps anzeigen".
    - `onClick: () => window.open(venue.googleMapsUrl, "_blank", "noopener,noreferrer")`.

- Header-Text bleibt „Gastro-Finder" + Untertitel „Public Viewing für Nachtspiele in Deutschland."

## 3. Version-Bump

- `src/routes/profil.tsx`: `APP_VERSION` von `"1.2.1"` → `"2.0.0"` (Major-Bump wegen substanzieller Daten-/UI-Änderung).

## 4. Aufräumen

- Wenn `src/data/bars.ts` keine weiteren Referenzen hat (Grep prüfen): Datei löschen. Sonst stehen lassen.

# Technische Details

- Keine neuen Dependencies.
- Type-Badge-Farben über bestehende Tokens (`primary`, `accent`, ggf. neu definierte semantische Klasse in `styles.css` falls nötig – ansonsten Tailwind-Utility mit Token-Mix).
- Nächstes-Match-Lookup ist ein simples `matches.filter(m => m.city === city && new Date(m.utcTimestamp) > now).sort(...)[0]`, memoized per `useMemo`.
- Kein Backend-/DB-Touch.

# Geänderte/neue Dateien

- **neu**: `src/data/publicViewingData.ts`
- **bearbeitet**: `src/routes/bars.tsx` (kompletter Rewrite des Render-/Filter-Teils)
- **bearbeitet**: `src/routes/profil.tsx` (Version)
- **optional gelöscht**: `src/data/bars.ts`
