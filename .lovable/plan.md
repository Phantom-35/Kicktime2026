# Fix: Admin-Override wird von API-Poll überschrieben

## Ursache

In `src/store/match-store.ts` → `applyUpdateInternal` gilt aktuell:

- Manuelles Update setzt `manualAt = Date.now()`, aber **nicht** `lastApiSignature`.
- Nächster API-Poll (`applyApiUpdate`) prüft `cur.manualAt && cur.lastApiSignature === incomingApiSig` — weil `lastApiSignature` `undefined` ist, greift der Guard nicht, das API-Payload wird gemergt, und im Anschluss wird `manualAt` sogar aktiv gelöscht (`merged.manualAt = undefined`).

Ergebnis: Toast „Live geschaltet ⚡" erscheint, Score erscheint für einen Frame, dann poppt der API-Wert zurück.

`match_overrides` ist zwar korrekt in Supabase geschrieben (Edge Function funktioniert), aber der laufende Client verwirft ihn sofort. Beim nächsten Reload wird der Override zwar via `fetchMatchOverrides` neu geladen — aber der API-Poll gewinnt danach wieder.

## Änderung

Regel: **Solange `manualAt` gesetzt ist, gewinnt der manuelle Zustand.** Nur ein „finished"-Signal der API (via `finishMatchFromApi`) oder ein expliziter `clearLiveOverlay` darf ihn ablösen.

### `src/store/match-store.ts`

In `applyUpdateInternal`, im `source === "api"`-Zweig:

- Statt der Signatur-basierten Heuristik: **wenn `cur.manualAt` gesetzt ist, API-Update komplett verwerfen** (`return s`). Kein Merge, kein Löschen von `manualAt`.
- Die bisherige `lastApiSignature`-Buchhaltung entfällt für diesen Zweig (kann weg oder als reines Debug-Feld bleiben — ich entferne sie).
- `finishMatchFromApi` bleibt wie er ist (löscht `manualAt` bewusst, damit das Endergebnis der API greifen darf).

`clearMatchOverride` (Client → Edge Function → RLS-Delete) ruft weiterhin `clearLiveOverlay` auf, das setzt `manualAt = undefined` → API übernimmt wieder.

### Kein Zeit-TTL

Bewusst kein automatisches Ablaufen des Locks nach X Minuten — der Admin entscheidet, wann der Override endet (via Trash-Button im `LiveOverridePanel`). Die bestehende „Match-Ende erreicht"-Zwangsfinalisierung in `applyUpdateInternal` (Zeile ~260) bleibt und räumt vergessene Live-Overrides auf.

## Verifikation

1. Typecheck (`bunx tsgo`).
2. Playwright: PIN eingeben → Live schalten mit z. B. 3:1 → 15 Sek. warten (mehrere API-Polls) → Score bleibt 3:1 auf `/index` und `/spiele`.
3. Trash-Button drücken → Override entfernt, API-Wert erscheint wieder.

## Betroffene Datei

- `src/store/match-store.ts` (nur `applyUpdateInternal`, ~30 Zeilen)
