# Update v6.4.0

## 1. Version
- `src/lib/version.ts` → `APP_VERSION = "6.4.0"`
- `package.json` → `"version": "6.4.0"`

## 2. TV-Sender via JSON-Datei

### Neue Datenquelle
- Datei `src/data/wm2026_uebertragung.json` (Copy aus dem Upload, unverändert).
- Neue Datei `src/lib/tv-overrides.ts` (ersetzt das bisherige hardcoded Mapping vollständig):
  - Lädt das JSON beim Modul-Load.
  - Iteriert alle Vorrunden-Spieltage + K.O.-Runden, baut eine Map auf:
    - **Gruppenphase**: Key `keyFor(teamCodeA, teamCodeB)` → broadcaster[].
    - **K.O.-Phase**: Key = `spiel_nr` → broadcaster[] (nur Finale = ZDF im JSON; alle anderen `null`).
  - Mapping deutscher Teamnamen → unsere Codes (aus `src/data/teams.ts`), z.B. „Deutschland"→GER, „Elfenbeinküste"→CIV, „Curaçao"→CUW, „DR Kongo"→COD, „Kap Verde"→CPV, „Saudi-Arabien"→KSA, „Bosnien-Herzegowina"→BIH, „USA"→USA, „Südkorea"→KOR, „Südafrika"→RSA, „Tschechien"→CZE, etc. (vollständige Tabelle in der Helper-Datei).
  - `anbieter`-Mapping: `"ARD"`→`["ARD"]`, `"ZDF"`→`["ZDF"]`, `"Magenta"`→`["MagentaTV"]`. `null` → keine Überschreibung (Match behält Wert aus `world_cup_2026_schedule.json`).
  - Helper `applyTvOverride(match)`:
    - Gruppenphase: Lookup über Team-Paar-Key.
    - K.O.-Phase: Lookup über Spielnummer (sofern Match eine `matchNo` hat); ansonsten Fallback: Finale→ZDF, sonst keine Änderung.
  - Primary-Picker (für `match.broadcaster`): ARD > ZDF > MagentaTV.

### K.O.-Spielnummern-Matching
- Prüfe in `src/data/world_cup_2026_schedule.json`, ob K.O.-Matches eine Nummer (z.B. `matchNo`/`number`/`id`) tragen. Falls ja → direkt nutzen. Falls nicht → Mapping via **Datum + Anstoßzeit** als Fallback (alle K.O.-Datumszeiten sind im JSON eindeutig).
- Effekt für v6.4.0: nur Finale → ZDF (alle anderen K.O.-Anbieter im JSON = `null`, also keine Änderung; die alte "GER → ARD/ZDF"-Default-Logik entfällt komplett).

### Integration
- `src/store/match-store.ts` ruft `applyTvOverride()` weiterhin in `seed()` auf — keine Änderung am Aufrufpunkt nötig.

## 3. Feedback-Frequenz: 8 statt 15

- `src/lib/open-counter.ts`:
  - Konstante `FREQUENCY` von `15` auf `8` ändern.
  - Logik (`count % FREQUENCY === 0` + `lastShownCount`-Guard) bleibt identisch.
- Bestehende Counter im `localStorage` werden NICHT zurückgesetzt — der Nutzer sieht das Modal beim nächsten durch 8 teilbaren Öffnen.

## 4. WhatsNewModal v6.4.0

`src/components/whats-new/WhatsNewModal.tsx` — Feature-Liste austauschen:
- 📺 **TV-Sender-Update** — Alle Übertragungsrechte über neue JSON-Datenstruktur aktualisiert.
- 💬 **Feedback-Optimierung** — Blitz-Abfrage erscheint nun alle 8 App-Öffnungen.

Version-Badge auf `v6.4.0`. Auto-Anzeige greift durch den Versions-Bump.

## 5. Geänderte / neue Dateien

**Neu:**
- `src/data/wm2026_uebertragung.json`

**Bearbeitet:**
- `src/lib/version.ts`, `package.json`
- `src/lib/tv-overrides.ts` (komplett umgebaut auf JSON-basiertes Mapping)
- `src/lib/open-counter.ts` (Frequenz 8)
- `src/components/whats-new/WhatsNewModal.tsx`

**Unverändert:** `match-store.ts`, `FeedbackModal.tsx`, `feedback.ts`, `AdminPanel.tsx`.

## 6. Manuelle Supabase-Schritte (am Ende)

Du erhältst nach dem Build einen Copy-Paste-Block mit:
1. `create table public.app_feedback ...` (idempotent via `if not exists`) + GRANTs + RLS + Insert-Policy.
2. `create or replace function public.get_feedback_summary()` + `grant execute`.
3. Verifikations-`SELECT`.

Falls die Tabelle aus v6.3.0 bereits existiert, sind die SQL-Befehle ungefährlich (no-op durch `if not exists` / `create or replace`).
