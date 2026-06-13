# Plan: Live-Logik, Phase-Anzeige, Live-Badge, Version 6.1

## 1. Dynamische Admin-Overrides (Edge Function)

`supabase/functions/fetch-live-scores/index.ts` – `mergeOverrides()` so anpassen, dass das manuelle Override automatisch **verworfen** wird (Override schreibt nicht), sobald die API "frischer" ist:

- API liefert `statusShort = "FT"` (Spiel beendet) → API gewinnt, Override wird ignoriert.
- API-Tor-Summe (`home+away`) > Override-Summe → API gewinnt.
- API-Status `1H/2H/HT` und Override-Status `scheduled` → API gewinnt.
- Sonst: Override gewinnt wie bisher.

Lokales JSON-Fallback: Aktuell gibt es im Edge-Function-Code **keinen** lokalen JSON-Fallback (nur Cache-Stale + Overrides-Only). Ich baue zusätzlich einen minimalen statischen Fallback **inline** in die Edge Function, damit bei totalem API-Ausfall und leerem Cache eine leere, aber konsistente Antwort kommt (Verhalten wie bisher: `{ fixtures: overridesOnly }`). Das echte Schedule-JSON lebt im Client (`src/data/world_cup_2026_schedule.json`) und ist die UI-Quelle der Wahrheit – das bleibt so.

URL `https://api.openligadb.de/getmatchdata/wm2026/2026`, 5-Min-Cache, CORS-Header und OPTIONS-Preflight bleiben unverändert.

## 2. Frontend-Reset (Mülleimer im Admin)

`LiveOverridePanel.tsx` hat bereits einen Trash-Button, der `clearMatchOverride` aufruft. Ergänzungen:

- Nach erfolgreichem `clearMatchOverride`: lokal aus dem Store das `liveScore`/`matchMinute` zurücksetzen und Status auf API-Wert zurückführen (sofort sichtbar, kein Wackeln beim nächsten Poll). Umsetzung: neue Action `clearLiveOverlay(id)` im match-store, die `liveScore`, `matchMinute` und `status` (bei nicht-finished) löscht; danach `useLiveApi` Poll triggern (best effort: erneutes `fetchLiveWorldCupData` über bereits exportierten Helper).
- Tooltip/aria "Manuellen Override entfernen".

`match-overrides.ts` → `clearMatchOverride`: nach DB-delete sofort `clearLiveOverlay` im Store aufrufen.

## 3. Spielphase statt Minute

`src/components/match/MatchCard.tsx` Zeile 52: `Live {minute}'` wird ersetzt durch dynamischen Phasen-Text per neuer Helper-Funktion `getMatchPhaseLabel(match)`:

```text
finished                           → "Beendet"
live + minute >= 46                → "2. Halbzeit"
live + minute zwischen 45-46 / HT  → "Halbzeitpause"
live + sonst                       → "1. Halbzeit"
```

Helper liegt in `src/lib/match-phase.ts`. Nutzung überall, wo aktuell die Minute angezeigt wird (MatchCard, TournamentCountdown – wenn vorhanden).

Hinweis: Die API liefert keinen separaten `HT`-Status; ich leite "Halbzeitpause" aus `matchMinute === 45` plus stehendem Timer ab (Edge Function `mapOpenLigaMatch` setzt schon `mm = 45` für 45 < raw < 60 — also der Halbzeit-Korridor, perfekt).

## 4. Live-Badge im MatchDetailSheet

`MatchDetailSheet.tsx` `DrawerHeader` ergänzen: wenn `match.status === "live"`, eine pulsierende rote `LIVE`-Pille (gleicher Stil wie auf den MatchCards) neben dem Titel + darunter Phase-Text aus `getMatchPhaseLabel`.

## 5. Version 6.1

`src/lib/version.ts`: `APP_VERSION = "6.1.0"`.

## Manuelle Schritte für dich

1. **Edge Function neu deployen**: Supabase Dashboard → Edge Functions → `fetch-live-scores` → Code aus dem ausgegebenen Block einfügen → Deploy.
2. Keine SQL-Änderungen, keine Secrets-Änderungen nötig.
3. Test: Manuelles Override setzen, dann im Admin Mülleimer klicken → Overlay verschwindet sofort, nach <5 Min liefert API wieder die reinen Daten.

## Geänderte / neue Dateien

- `supabase/functions/fetch-live-scores/index.ts` (dynamische Override-Merge-Regeln)
- `src/lib/match-overrides.ts` (lokaler Reset nach delete)
- `src/store/match-store.ts` (`clearLiveOverlay` Action)
- `src/lib/match-phase.ts` (neu)
- `src/components/match/MatchCard.tsx` (Phase statt Minute)
- `src/components/match/MatchDetailSheet.tsx` (Live-Badge im Header)
- `src/components/admin/LiveOverridePanel.tsx` (Tooltip + Reset-Refresh)
- `src/lib/version.ts` (6.1.0)
