## Ziel
Kritischen Datenverlust beheben: Beim Wechsel der API-Phase (z. B. /4, /5) verschwinden bislang die Ergebnisse aller anderen Phasen, weil jede URL nur ihre Teilmenge liefert und der Match-Store direkt daraus befüllt wird. Lösung: eine dauerhafte Supabase-Tabelle als Single Source of Truth, die niemals Ergebnisse verliert und additiv gemergt wird.

## 1. Neue Supabase-Tabelle `match_results`
Persistenter Speicher für alle je gesehenen Spielstände aus der OpenLigaDB-API.

Spalten:
- `match_id` (text, PK) — aus OpenLigaDB `matchID`
- `phase` (int, nullable) — 4–9 für KO-URLs, null für wm2026-Gruppenphase
- `team_home_name`, `team_away_name` (text)
- `score_home`, `score_away` (int, nullable)
- `status` (text: `scheduled` | `live` | `finished`)
- `minute` (int, nullable)
- `kickoff_utc` (timestamptz, nullable)
- `stadium`, `city` (text, nullable)
- `raw` (jsonb) — zuletzt gesehenes API-Rohobjekt für Debugging
- `updated_at` (timestamptz, default now())
- `finished_at` (timestamptz, nullable) — gesetzt beim ersten `FT`

RLS: `SELECT` für `anon` und `authenticated` erlauben (Lesen ist öffentlich, Schreiben nur Service-Role via Edge Function).

## 2. Edge Function `fetch-live-scores` erweitern
Zusätzlich zum bestehenden Cache/Merge-Verhalten:
1. Nach jedem erfolgreichen Upstream-Fetch: alle gemappten Matches per Upsert in `match_results` schreiben — **niemals überschreibend für abgeschlossene Ergebnisse**:
   - Wenn Zeile existiert mit `status = 'finished'` und `score_home/score_away IS NOT NULL`: nur `raw`/`updated_at` aktualisieren, Score & Status bleiben.
   - Sonst: alle Felder updaten; sobald erstmals `finished` mit Score kommt, `finished_at = now()`.
2. Neuer Body-Parameter `mode: "sync-groups"` → zwingend `wm2026/2026` abfragen und in DB schreiben, unabhängig vom Cache. Antwort: `{ synced: <count> }`.
3. Neuer Body-Parameter `mode: "full-store"` → gibt den **kompletten Inhalt** von `match_results` als Fixtures im bekannten Format zurück (statt nur der aktuellen Phase). Das nutzt das Frontend beim Poll.

Bestehende `live`/`idle`-Modi bleiben funktional (Rückwärtskompatibilität), das Frontend nutzt sie aber nicht mehr als Datenquelle für die Anzeige — nur noch als Trigger zum Upstream-Refresh.

## 3. Frontend-Umstellung
- `src/services/footballApi.ts`: neue Funktion `fetchAllStoredFixtures()` → ruft Edge Function mit `mode: "full-store"` auf und liefert alle DB-Fixtures.
- `src/hooks/useLiveApi.ts`:
  - Poll-Zyklus (5 Min): erst `fetchLiveWorldCupData(mode, koPhase)` (füllt DB in der Edge Function), dann `fetchAllStoredFixtures()` und dessen Ergebnis in den Match-Store übernehmen. So kommen immer alle Phasen zusammen an.
  - Initial-Sync: Beim Mount ein `mode: "full-store"` Call. Wenn Antwort leer ist → einmalig `mode: "sync-groups"` auslösen, danach nochmal `full-store` laden. Flag im `localStorage` (`kicktime-initial-sync-done`), damit das nicht in Endlosschleife läuft, falls die API dauerhaft leer ist.
- `applyLiveFixturesToStore` bleibt unverändert (arbeitet weiterhin mit dem Fixture-Array).

## 4. Admin-Panel: Manueller Sync-Button
In `src/components/admin/SystemMonitor.tsx` unter "MANUELLER OVERRIDE (BACKUP)" neuer Button **„Gruppenphase manuell synchronisieren (wm2026)“**:
- Ruft Edge Function mit `mode: "sync-groups"` auf.
- Toast mit Anzahl synchronisierter Spiele oder Fehlermeldung.
- Danach automatisch `fetchAllStoredFixtures()` → Store aktualisiert.

## 5. Nicht anfassen
- Keine Änderung an v7.7-Features (Telemetrie, Turnier-Status-Tab, Error-Log, /4-Override-Button).
- Kein Eintrag im `WhatsNewModal.tsx`.
- Keine Versions-Bump-Anforderung vom User → Version bleibt `7.7.0`.

## Manuelle Supabase-Schritte (nach dem Code-Deploy)
Zwei Schritte im Supabase-Dashboard:

**Schritt 1 — SQL-Editor:** folgendes Script ausführen (legt Tabelle + RLS + Grants an):
```sql
create table if not exists public.match_results (
  match_id        text primary key,
  phase           int,
  team_home_name  text,
  team_away_name  text,
  score_home      int,
  score_away      int,
  status          text not null default 'scheduled',
  minute          int,
  kickoff_utc     timestamptz,
  stadium         text,
  city            text,
  raw             jsonb,
  finished_at     timestamptz,
  updated_at      timestamptz not null default now()
);

grant select on public.match_results to anon, authenticated;
grant all    on public.match_results to service_role;

alter table public.match_results enable row level security;

create policy "public read match_results"
  on public.match_results for select
  to anon, authenticated
  using (true);
```

**Schritt 2 — Edge Function neu deployen:**
```bash
supabase functions deploy fetch-live-scores
```

Danach im Admin-Panel einmal auf **„Gruppenphase manuell synchronisieren (wm2026)“** klicken, um die DB initial zu füllen (das passiert sonst auch beim ersten App-Öffnen automatisch).

## Betroffene Dateien
- `supabase/functions/fetch-live-scores/index.ts` (erweitern)
- `src/services/footballApi.ts` (neue `fetchAllStoredFixtures`)
- `src/hooks/useLiveApi.ts` (Poll- und Init-Logik)
- `src/components/admin/SystemMonitor.tsx` (Sync-Button)
