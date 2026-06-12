# Plan: Edge Function `fetch-live-scores` auf neuen OpenLigaDB-Endpunkt umstellen

## Ziel
Die Edge Function nutzt aktuell `https://api.openligadb.de/getmatchdata/wm/2026`. Wir stellen sie auf den verifizierten Endpunkt `https://api.openligadb.de/getmatchdata/wm2026/2026` um — ohne sonstige Logik anzufassen.

## Änderungen in `supabase/functions/fetch-live-scores/index.ts`

1. **Konstante `UPSTREAM_URL`**
   - alt: `https://api.openligadb.de/getmatchdata/wm/2026`
   - neu: `https://api.openligadb.de/getmatchdata/wm2026/2026`

2. **Unverändert bleiben (explizit geprüft):**
   - `CORS_HEADERS` inkl. OPTIONS-Preflight (204).
   - 5-Minuten-Cache (`LIVE_TTL_MS = IDLE_TTL_MS = 300_000`) in `live_fixtures_cache`.
   - `loadOverrides()` + `mergeOverrides()` — manuelle Admin-Einträge aus `match_overrides` (`is_manual = true`) überschreiben IMMER die API-Daten (Tore, Status, Minute).
   - Fallback-Kette bei Upstream-Fehler: stale Cache → reine Overrides → `{ fixtures: [] }` mit CORS-Headern.
   - `mapOpenLigaMatch()` (Mapping auf das interne API-Football-ähnliche Format) bleibt identisch — das OpenLigaDB-Schema ist für beide Endpunkte gleich.

3. **Hinweis zum lokalen JSON-Fallback**
   Im aktuellen Code gibt es KEINEN Fallback auf `src/data/world_cup_2026_schedule.json` — das wäre auch in Edge-Functions schwierig (Datei liegt im Frontend-Bundle). Stattdessen ist der Fallback der Cache + Overrides. Ich behalte dieses Verhalten bei. Wenn du wirklich den lokalen Spielplan als zusätzliche Reserve in die Edge Function packen willst, müsste ich den Spielplan in die Function einbetten (eigenes JSON unter `supabase/functions/fetch-live-scores/`) — sag kurz Bescheid, dann ergänze ich das in einem separaten Schritt.

## Manuelles Deployment (nach Implementierung)

Da das Projekt **keine** Supabase-CLI-Integration nutzt und nur eine einzige Edge Function im Dashboard liegt:

1. Supabase Dashboard → **Edge Functions** → `fetch-live-scores` → **Code**.
2. Inhalt komplett ersetzen durch den neuen `index.ts`-Block (kommt nach Approval).
3. **Deploy** klicken und auf „Deployed“-Status warten.
4. Im Dashboard → **Edge Functions → fetch-live-scores → Logs** prüfen: erster Aufruf sollte `cache: "miss"` und Statuscode 200 zeigen.
5. Optional Smoke-Test im Browser-Devtools (Network) auf `/spiele`: erster Fetch nach Cache-Ablauf muss 200 zurückgeben, `fixtures.length > 0`.
6. Admin-Panel testen: Override setzen → in der Spiele-Liste muss sofort der manuelle Wert erscheinen und auch nach 5 min (nächster Upstream-Refresh) erhalten bleiben.

Keine SQL-Änderungen nötig — `match_overrides` und `live_fixtures_cache` sind bereits korrekt aufgesetzt.

## Output nach Approval
Im Build-Schritt liefere ich:
- den **vollständigen** `index.ts`-Code in einem einzigen Code-Block (Copy-Paste-fertig),
- die obige Deployment-Checkliste in Kurzform unter dem Code.

Soll ich so umsetzen?
