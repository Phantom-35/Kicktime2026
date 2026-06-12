
# KickTime v6.0.0 — Unabhängig & Sicher

Großer Schnitt: Wir lösen uns komplett von API-Football und ziehen auf die freie OpenLigaDB-API um. Das Admin-Panel bekommt einen PIN-Schutz (5046) und ein Live-Override für Spielstände. Außerdem ein harter Bugfix für den Spoilerschutz.

---

## 1. Version & "Was ist neu"-Modal

- `src/lib/version.ts` → `APP_VERSION = "6.0.0"`.
- `WhatsNewModal.tsx`: Titel **„Update auf v6.0.0 — Unabhängig & Sicher"**, 4 Features (Icons: Radio/📡, Lock/🔒, Gamepad2/🎮, Eye/👁️):
  - 📡 **OpenLigaDB** — Vollständiger Wechsel auf die freie, quelloffene API – absolut krisensicher und ohne Sperren.
  - 🔒 **PIN-Schutz** — Das Admin-Dashboard ist ab sofort mit dem Code 5046 vor unbefugtem Zugriff geschützt.
  - 🎮 **Live-Override** — Der Admin kann Spielstände im Notfall live manuell überschreiben, falls die API verzögert ist.
  - 👁️ **Spoiler-Fix** — Einmal aufgedeckte Ergebnisse bleiben jetzt auch auf den Dashboard-Karten dauerhaft sichtbar.
- Trigger bleibt im `__root.tsx`: `lastSeenVersion !== "6.0.0"` → Modal öffnet zwingend einmal nach dem Update.

## 2. Edge Function auf OpenLigaDB umstellen

`supabase/functions/fetch-live-scores/index.ts` wird komplett neu verdrahtet:

- Entferne `API_FOOTBALL_KEY` und den `v3.football.api-sports.io`-Call.
- Neuer Upstream: `GET https://api.openligadb.de/getmatchdata/wm/2026` — kein Header, kein Key.
- Cache-Schicht bleibt unverändert (Tabelle `live_fixtures_cache`, Modi `live` → 60 s, `idle` → 4 h, Graceful-Fallback bei Upstream-Fehler).
- **Mapping** OpenLigaDB → bisheriges `RawFixture`-Schema, damit `footballApi.ts` nicht angefasst werden muss:

```text
matchID            → fixture.id
matchDateTimeUTC   → fixture.date (ISO)
team1.shortName    → teams.home.name   (Mapping über apiNameToCode greift)
team2.shortName    → teams.away.name
matchIsFinished    → status.short = "FT" sonst …
matchResults[ResultTypeID==2|Endergebnis] → goals.home/away (final)
matchResults[ResultTypeID==1|Halbzeit]    → Fallback bei Halbzeit
location.locationStadium / locationCity   → fixture.venue
```

- **Spielminuten / Live-Erkennung:** OpenLigaDB liefert keine `elapsed`-Minute, aber Goals mit `matchMinute`. Live-Status = `!matchIsFinished && now ≥ matchDateTimeUTC && now ≤ matchDateTimeUTC + 130 min`. `status.elapsed` = `min(120, floor((now − kickoff) / 60_000))`, Halbzeitpause-Korrektur (45–60 min → cap auf 45). Goals werden auf höchste `matchMinute` summiert, damit der Live-Score während des Spiels stimmt.
- **Manual-Override-Merge (siehe §3):** Nach Mapping liest die Function `match_overrides` (Tabelle, siehe SQL unten) und überschreibt im Response-Array Score/Minute/Status für jedes Match mit `is_manual = true`. Cache-Hits werden ebenfalls durch Overrides geschickt, damit eine Admin-Änderung sofort wirkt (Cache enthält rohen Upstream, Overrides werden bei jeder Antwort frisch gemerged).

## 3. Admin-Panel: PIN + Live-Override

### PIN-Gate (`AdminPanel.tsx`)
- Statt direkt Telemetrie zu zeigen: erster Schritt ist ein minimalistisches PIN-Eingabefeld (4 Ziffern, `inputMode="numeric"`, autoFocus, kein Submit-Button — bei 4 Ziffern automatisch validieren).
- Hardcoded Vergleich gegen `"5046"`. Bei Erfolg: `haptics.success()`, Inhalt freischalten. Bei Falscheingabe: Shake-Animation, Feld leeren, `haptics.error()`.
- Erfolgreiche Eingabe gilt für die Lebensdauer des Dialogs; beim Schließen wird `unlocked` zurückgesetzt.

### Live-Override-Tab
Admin-Panel bekommt Tabs **„📊 Telemetrie"** (bisheriger Inhalt) und **„🎮 Live-Override"**.

Live-Override-Tab:
- Lädt alle Matches aus `useMatchStore` (clientseitig — kein Extra-Fetch), sortiert: heute/live zuerst, dann kommende, dann finished. Suchfeld „Team oder Datum".
- Pro Match eine Zeile mit: Flag/Code beider Teams, Anpfiff-Zeit, kleinem Formular:
  - 2× NumberStepper Tore (0–20)
  - Spielminuten-Input (0–120)
  - Status-Select: `scheduled | live | finished`
  - Button **„Änderungen live schalten"** → schreibt in Supabase `match_overrides` (Upsert nach `match_id`).
- Roter Button **„Override entfernen"** löscht den Eintrag wieder.
- Visualisierung: aktive Overrides bekommen einen pulsierenden roten Dot + Label „MANUELL LIVE".

Schreiben passiert via neuer Server-Function `src/lib/admin.functions.ts`:
- `setMatchOverride({ matchId, scoreA, scoreB, minute, status })` und `clearMatchOverride({ matchId })`.
- Beide validieren PIN (Body-Param `pin === "5046"`) — kein Supabase-Auth nötig, weil App komplett anonym betrieben wird. Das ist Defense-in-Depth zusätzlich zum Client-Gate.
- Server-Function nutzt `supabaseAdmin` (Service Role) für den Upsert in `match_overrides`. Import passiert **innerhalb** des Handlers (Best Practice für `*.functions.ts`).

## 4. Bugfix Spoiler-Sync auf Dashboard

Aktueller Stand: `revealedMatches` liegt bereits in `useAppStore` und der Store ist via `zustand/persist` unter Key `kicktime-2026` persistiert. Bug liegt darin, dass die Dashboard-Karte (`MatchCard` über `Stream` in `routes/index.tsx`) den Reveal-Zustand nicht aus dem Store liest, sondern aus lokalem `useState`, das beim Re-Render durch Live-Polling verloren geht.

Fix:
- `routes/index.tsx`: lokale `revealed`-Records im `MissedStream`/`Stream` entfernen. Stattdessen `const revealedMatches = useAppStore((s) => s.revealedMatches)` und `const reveal = useAppStore((s) => s.revealMatch)`. `match.id in revealedMatches` ist Single Source of Truth.
- `MatchDetailSheet.tsx` ebenfalls — Klick auf „Ergebnis aufdecken" ruft nur noch `reveal(match.id)`. Kein lokaler State mehr.
- Sanity-Check: `partialize` ist im Store **nicht** gesetzt → `revealedMatches` wird automatisch mitpersistiert. Kein Migration-Block nötig (fehlender Key → leeres Objekt).

## 5. Telemetry-Modul

Keine Änderung — `src/lib/telemetry.ts` sendet weiterhin Pings mit `APP_VERSION = "6.0.0"`. Das Admin-Panel zeigt die neue Version dann automatisch in der Verteilung.

---

## Technische Details (Dateien)

- **Edit:** `src/lib/version.ts`, `src/components/whats-new/WhatsNewModal.tsx`, `src/components/admin/AdminPanel.tsx`, `src/routes/index.tsx`, `src/components/match/MatchDetailSheet.tsx`, `supabase/functions/fetch-live-scores/index.ts`.
- **Neu:** `src/lib/admin.functions.ts` (Server-Functions für Override-Upsert/Delete inkl. PIN-Check), `src/components/admin/PinGate.tsx`, `src/components/admin/LiveOverridePanel.tsx`.
- **Migration (automatisch):** Neue Tabelle `match_overrides` inkl. RLS-Policies & Grants. `live_fixtures_cache` und `app_pings` bleiben wie sie sind.

```sql
-- match_overrides: manuelle Live-Steuerung durch Admin
CREATE TABLE IF NOT EXISTS public.match_overrides (
  match_id      text PRIMARY KEY,
  score_a       int  NOT NULL,
  score_b       int  NOT NULL,
  minute        int,
  status        text NOT NULL,
  is_manual     boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.match_overrides TO anon, authenticated;
GRANT ALL    ON public.match_overrides TO service_role;
ALTER TABLE public.match_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read overrides" ON public.match_overrides
  FOR SELECT TO anon, authenticated USING (true);
-- Schreiben passiert ausschließlich über service_role aus der Edge-/Server-Function.
```

---

## Was DU manuell im Supabase-Dashboard tun musst

Die neue Tabelle `match_overrides` (inkl. RLS und Grants) wird per Migration automatisch angelegt. Der `API_FOOTBALL_KEY` wird **nicht mehr gebraucht**:

1. **Optional aufräumen:** Im Supabase-Dashboard → Edge Functions → Secrets das alte Secret `API_FOOTBALL_KEY` löschen. Schadet nicht, wenn es bleibt — die neue Function liest es einfach nicht mehr.
2. **Sonst nichts.** Keine manuellen SQL-Befehle, keine RLS-Anpassungen, keine zusätzlichen Grants nötig. Die Edge Function wird beim Deploy automatisch aktualisiert.

## Validierung nach dem Build

- App öffnen → Modal „Update auf v6.0.0" erscheint genau einmal.
- Im Profil 5× auf Versionsnummer tippen → PIN-Dialog. Falsche PIN → Shake. „5046" → Admin-Dashboard mit Tabs.
- Im „Live-Override"-Tab ein beliebiges Match wählen, Tore + Minute + Status setzen, „Änderungen live schalten" → innerhalb einer Polling-Runde (max 90 s) zeigt das Dashboard die manuellen Werte.
- „Ergebnis aufdecken" im Detailsheet schließen → Dashboard-Karte bleibt **dauerhaft** unverschwommen, auch nach Reload und Live-Polling.
- Edge-Function-Logs zeigen `cache HIT/MISS` und keinen Verweis mehr auf API-Football.
