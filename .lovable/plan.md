# KickTime v5.4.0 — Highlights, Smart-Data, Live-Präzision & Admin

Großes Update mit neuer Telemetrie-Tabelle in Supabase, intelligentem API-Caching, UX-Polish und einem versteckten Admin-Dashboard. Kein Breaking Change am bestehenden Schema.

---

## 1. Version & „Was ist neu" (v5.4.0)

- `src/lib/version.ts` → `APP_VERSION = "5.4.0"`.
- `WhatsNewModal.tsx`: Titel **„Update auf v5.4.0 — Smart & Live"**, 4 Karten in motivierendem Ton:
  - 🏆 **Turnier-Highlights** — Neuer „Highlights"-Filter zeigt Eröffnung, Viertel-/Halbfinale & Finale.
  - ⚡ **Smart-Data** — Live-Caching schont das API-Kontingent und lädt blitzschnell.
  - ⏱️ **Live-Präzision** — Spielminuten jetzt aus echter API-`elapsed`-Zeit (verspäteter Anpfiff egal).
  - 🐞 **iOS-Feinschliff** — Butterweiches Schließen der Detailsheets + robustere Push-Glocke.
- `__root.tsx`: Trigger bleibt wie gehabt (Version-Vergleich → einmaliges Anzeigen pro Update). Bestehende Nutzer sehen das Modal nach dem ersten Start zwingend, weil `lastSeenVersion !== "5.4.0"`.

## 2. Smart Live-Caching (API-Schutzschild)

**Neue Supabase-Tabelle `live_fixtures_cache`** als Server-Cache zwischen App und API-Football:

```text
live_fixtures_cache
  id            text primary key      -- "world-cup-2026"
  payload       jsonb not null        -- letzte Response von API-Football
  fetched_at    timestamptz not null
```

`supabase/functions/fetch-live-scores/index.ts` erweitern:
- Body-Parameter `{ mode: "idle" | "live" }`. App entscheidet, was sie braucht.
- Vor Upstream-Call: Cache aus `live_fixtures_cache` lesen.
  - `mode === "live"` → Cache gilt für 60 s.
  - `mode === "idle"` → Cache gilt für 4 h.
  - Bei Cache-Hit: gecachte `payload` zurückgeben, **kein** Upstream-Hit.
- Bei Miss: Upstream + `upsert` in `live_fixtures_cache`. Fehlerfall: letzten Cache zurückgeben (graceful).
- API-Key-Header bleibt `x-apisports-key: $API_FOOTBALL_KEY` (der neu hinterlegte Key).

`src/hooks/useLiveApi.ts` umbauen zum **adaptiven Poller**:
- „Live-Fenster" = ein Match ist `live` **oder** Anpfiff in ≤15 min **oder** Abpfiff vor ≤15 min.
- Live-Fenster: Poll alle 90 s, `mode: "live"`.
- Außerhalb: 1× beim Mount (wenn letzter Fetch >4 h zurück, persisted in `localStorage` als `kicktime-last-idle-fetch`), dann kein Interval.
- `fetchLiveWorldCupData(mode)` nimmt jetzt einen Mode-Parameter und reicht ihn an die Edge Function durch.

## 3. Spoiler-Sync Dashboard ↔ Detailsheet

- Neuer State im `useAppStore`: `revealedMatches: Record<string, true>` + `revealMatch(id)`.
- `MatchDetailSheet.tsx`: lokales `revealed` ersetzen durch Store-Lookup. Klick auf „Ergebnis aufdecken" → `revealMatch(match.id)`.
- `routes/index.tsx` `MissedStream`: lokales `revealed`-Record ersetzen durch Store-Lookup; Button schreibt ebenfalls in Store. Folge: Schließen des Sheets lässt Score auf der Karte sofort sichtbar.
- Persistiert automatisch via `zustand/persist` (kein Migration-Block nötig — fehlender Key fällt auf `{}` zurück).

## 4. Echte Spielminute

- `match-store.rollMatches`: Live-Minute nicht mehr aus `now − kickoff` berechnen, **außer** wenn die API noch keine `matchMinute` geliefert hat. Heißt: `applyLiveUpdate` setzt `matchMinute` aus `fixture.status.elapsed` (passiert bereits in `footballApi.ts`) und `rollMatches` lässt den Wert unangetastet, solange `status === "live"` und `matchMinute` aus dem letzten Update vorhanden ist.
- Konkret: Wenn `m.status === "live"` und `m.matchMinute` gesetzt → nur `status` nicht zurücksetzen. Fallback-Berechnung nur greift, wenn `matchMinute === undefined` (Pre-API-Phase / Simulator).

## 5. ARD/ZDF-Kombi-Label auf der Karte

- `MatchCard.tsx` Render-Logik der Sender-Zeile: wenn `getBroadcastersForMatch` ein Free-TV-Element (ARD oder ZDF) enthält → Label `"ARD/ZDF"` rendern (statt einzelnem Namen). MagentaTV ggf. mit `·` angehängt.
- Pure UI-Änderung, keine Logik-Anpassung in `broadcaster.ts`.

## 6. Highlights-Filter (4. Tab)

- `routes/index.tsx`: `TabsList` von `grid-cols-3` → `grid-cols-4`, neuer Tab **„🏆 Highlights"**.
- Neue Hilfsfunktion `selectHighlightMatches(matches)`:
  - Eröffnungsspiel = chronologisch erstes Match mit `stage === "group"`.
  - Alle Matches mit `stage` in `{"quarter","semi","final","third-place"}` (an `MatchStage`-Enum angepasst — bei abweichenden Namen entsprechend mappen).
- Tab zeigt diese Liste **unabhängig** von Favoriten/Interessant/Verfügbarkeit. Wiederverwendet die bestehende `Stream`-Komponente mit `indicator={null}` und Footer = Kalender-Button + AlarmBell.

## 7. iOS Touch-Fix Detailsheet

- `MatchDetailSheet.tsx`: Drawer-Konfiguration auf vaul-Best-Practice für iOS:
  - `snapPoints={[1]}` weglassen (volle Drag-Range).
  - `dismissible` bleibt true; `closeThreshold={0.35}` (etwas weniger zackig als 0.2).
  - `DrawerContent` zusätzliche Klassen: `transition-none` entfernen falls vorhanden; `touch-pan-y` auf den Header lassen; **inneren Scroll-Container** mit `overscroll-behavior: contain` und `data-vaul-no-drag` markieren, damit Scrollen ≠ Drag.
- `DrawerHeader`: `touch-none` raus (blockt sonst flüssiges Drag-Tracking), stattdessen `touch-pan-y select-none`.
- CSS-Hint global: in `styles.css` `[data-vaul-drawer] { -webkit-overflow-scrolling: touch; }` ergänzen.

## 8. Robusterer iOS-Push-Trigger

- `AlarmBell.tsx`: Vor `setAlarm(match.id, true)` `detectPushSupport()` aufrufen. Wenn `"ios-needs-pwa"` → `toast` mit Hinweis „App zuerst zum Home-Bildschirm hinzufügen, sonst kann iOS keine Benachrichtigungen senden." und Alarm **nicht** setzen. Andere Werte verhalten sich wie bisher.
- `notifications.ts`: keine Änderung nötig.

## 9. Anonymes Admin-Telemetrie-Dashboard

**Neue Supabase-Tabelle `app_pings`:**

```text
app_pings
  client_id    text primary key       -- random uuid aus localStorage
  last_ping    timestamptz not null
  app_version  text not null
  fav_team     text                   -- erstes favoriteTeams[0] oder null
  updated_at   timestamptz default now()
```

RLS:
- Tabelle hat RLS enabled.
- Policy `anon upsert own ping`: `INSERT/UPDATE` für Rolle `anon` mit `USING (true) WITH CHECK (true)` (Daten sind anonym; kein PII).
- Grants: `GRANT SELECT, INSERT, UPDATE ON public.app_pings TO anon, authenticated;` + `GRANT ALL TO service_role;`.
- **Kein IP-Logging** — Supabase-Default schreibt nichts personenbezogen in die Tabelle.

**Client-Code:**
- Neues Modul `src/lib/telemetry.ts`:
  - `getClientId()` — generiert/persistiert `crypto.randomUUID()` in `localStorage["kicktime-client-id"]`.
  - `sendPing()` — `supabase.from("app_pings").upsert({ client_id, last_ping: new Date().toISOString(), app_version: APP_VERSION, fav_team: favoriteTeams[0] ?? null })`.
  - Throttle: maximal 1 Ping/5 min (per `localStorage["kicktime-last-ping"]`).
- In `__root.tsx` einmalig nach `appReady` aufrufen + `setInterval` 5 min.

**Easter-Egg & Admin-Modal:**
- `routes/profil.tsx`: Versionsnummer in `<button>` umbauen. Klick-Counter mit 1.5 s-Reset-Fenster. Bei 5 Klicks → `haptics.success()` + `setAdminOpen(true)`.
- Neue Komponente `src/components/admin/AdminPanel.tsx` (Dialog):
  - Lädt einmalig: `supabase.from("app_pings").select("client_id, last_ping, app_version, fav_team")`.
  - Metriken im Client berechnen:
    - **Aktive Nutzer (5 min):** `count(last_ping >= now-5min)`.
    - **Geräte gesamt:** `total rows`.
    - **Versions-Verteilung:** Gruppierung nach `app_version` mit Prozent.
    - **Top-Fanteams:** `fav_team` nicht-null gruppieren, sortiert absteigend, Top 5.
  - Minimalistisches Dark-Layout (Listen + Balken), Refresh-Button.

## 10. API-Key-Verifikation

- Edge Function loggt erfolgreichen Upstream-Call mit Status. Nach Deploy 1× per `stack_modern--server-function-logs` prüfen (falls erforderlich nach Build).
- Falls API-Key abgelaufen: Fehlerpfad gibt nun letzten Cache-Eintrag zurück → App bleibt funktional.

---

## Technische Details (Dateien)

- **Edit:** `src/lib/version.ts`, `src/components/whats-new/WhatsNewModal.tsx`, `src/store/app-store.ts`, `src/store/match-store.ts`, `src/services/footballApi.ts`, `src/hooks/useLiveApi.ts`, `src/components/match/MatchDetailSheet.tsx`, `src/components/match/MatchCard.tsx`, `src/components/match/AlarmBell.tsx`, `src/routes/index.tsx`, `src/routes/profil.tsx`, `src/routes/__root.tsx`, `src/styles.css`, `supabase/functions/fetch-live-scores/index.ts`.
- **Neu:** `src/lib/telemetry.ts`, `src/components/admin/AdminPanel.tsx`.
- **Migration (SQL):** Tabellen `live_fixtures_cache` + `app_pings` inkl. RLS & Grants. Wird per Migration-Tool ausgeführt.

## Was DU manuell im Supabase-Dashboard tun musst

Die Migration legt Tabellen, RLS-Policies und Grants automatisch an. **Nichts SQL-mäßig manuell nötig.** Du musst nur:

1. **API-Football-Key prüfen:** Im Supabase-Dashboard → Edge Functions → Secrets sicherstellen, dass `API_FOOTBALL_KEY` auf den neuen Wert gesetzt ist (du sagst, das ist erledigt — Code geht davon aus).
2. **Edge Function neu deployen** ist nicht nötig — Lovable deployt automatisch, sobald die Datei geändert wird.
3. Nichts weiter — `live_fixtures_cache` und `app_pings` werden per Migration angelegt und sind sofort einsatzbereit.

## Validierung (nach Build)

- Modal öffnet sich nach erstem Start (lastSeenVersion ≠ 5.4.0).
- Highlights-Tab zeigt Eröffnung + KO-Runde unabhängig von Favoriten.
- Aufdecken im Sheet → Karte zeigt Score sofort ohne Blur.
- ARD/ZDF-Label sichtbar.
- Versions-Tap (5×) öffnet Admin-Panel mit Live-Metriken (sobald Pings existieren).
- Edge-Function-Logs zeigen Cache-Hits/Misses.
