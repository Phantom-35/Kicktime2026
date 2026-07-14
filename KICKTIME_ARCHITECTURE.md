# KickTime — Systemarchitektur & Entwickler-Handbuch

Diese Datei ist die zentrale Referenz für Menschen und LLM-Agenten (Claude,
Gemini, GPT, Lovable-Agent), um KickTime zu verstehen, zu warten und für
zukünftige Turniere (EM 2028 UK, WM 2030 …) zu klonen. Stand: **v7.11.0**
(Endgame-Feature, Weltmeister 2026).

> Regel Nr. 1: **API-Daten sind Wahrheit, Overrides sind sticky, Platzhalter
> werden automatisch aufgelöst — niemals hart überschreiben, ohne die
> `apiMatchId` als Primary Key zu respektieren.**

---

## 1. Systemübersicht & Tech-Stack

### 1.1 Frontend

| Layer            | Technologie                                            |
| ---------------- | ------------------------------------------------------ |
| Build            | **Vite 7**                                             |
| Framework        | **TanStack Start v1** + **TanStack Router** (file-based) |
| UI               | **React 19**, **framer-motion**, **lucide-react**, shadcn/ui |
| Styling          | **Tailwind CSS v4** (via `src/styles.css`, keine tailwind.config.js) |
| State            | **Zustand** (`src/store/match-store.ts`, `src/store/app-store.ts`) mit `persist`-Middleware (localStorage) |
| Server-Runtime   | **Cloudflare Worker** (via TanStack Start SSR-Adapter, `nodejs_compat`) |
| Push             | Web Push (VAPID), Service Worker `public/sw.js`         |

### 1.2 Backend (Supabase)

| Komponente          | Zweck                                                  |
| ------------------- | ------------------------------------------------------ |
| PostgreSQL          | Ergebnisse, Cache, Push-Abos, Telemetrie               |
| RLS                 | Public READ, Writes nur via Edge Functions (Service-Role) |
| Edge Functions (Deno) | `fetch-live-scores`, `admin-override`, `send-push-reminders` |
| pg_cron             | Trigger für Push-Reminders + Live-Sync                 |

### 1.3 Datenquelle: OpenLigaDB

- Basis-URL: `https://api.openligadb.de/getmatchdata/wm2026/<phase>`
- Phasen 1–3: Gruppenspieltage. Phasen 4–9: KO-Runden
  (4 = R32/Sechzehntelfinale, 5 = R16/Achtelfinale, 6 = QF, 7 = SF, 8 = 3.
  Platz, 9 = Finale).
- Kostenfrei, kein API-Key nötig. Fallback: `API_FOOTBALL_KEY` als Secret in
  Supabase reserviert, aktuell nicht genutzt.

### 1.4 Datenfluss

```text
  ┌──────────────┐        ┌────────────────────────────┐
  │ OpenLigaDB   │◀──────▶│ Edge Fn `fetch-live-scores`│
  └──────────────┘        │  - 5-min Cache             │
                          │  - Persist → match_results │
                          │  - Merge match_overrides   │
                          └────────────┬───────────────┘
                                       │ JSON
                                       ▼
  ┌────────────────────────────────────────────────────┐
  │ Frontend `useLiveApi` → `applyLiveFixturesToStore` │
  │   → Zustand `match-store` (persist, spoiler-safe)  │
  └────────────────────────────────────────────────────┘
                                       │
                                       ▼
             Components: MatchCard, Dashboard, TurnierTab, …
```

---

## 2. UI/UX & Mobile-First Design

### 2.1 Spoilerschutz (global)

- State: `revealedMatches: Set<string>` im `app-store` (persistiert).
- Header-Toggle (`AppHeader.tsx`) schaltet globalen Modus `spoilerFree`
  on/off — Live-/Fertig-Spiele werden ausgegraut, Score maskiert (`-:-`),
  Klick auf Karte fügt Match-ID zu `revealedMatches` hinzu, damit einzelne
  Spiele individuell enthüllt bleiben.
- Genutzt in `spiele.tsx` (Liste), `MatchCard.tsx` (Rendering) und
  `MatchDetailSheet.tsx` (Detailansicht) — Single Source of Truth.

### 2.2 Touch-Hitbox-Regel: 48×48 Minimum

- Alle interaktiven Elemente auf Touchgeräten **müssen mindestens 48×48 CSS-px**
  Trefferfläche haben (WCAG 2.5.5 / Material Guidelines).
- Umsetzung: Padding auf den Klick-Container legen, Icon-Größe visuell klein
  halten. Beispielmuster:
  ```tsx
  <button className="flex h-11 w-11 items-center justify-center rounded-full">
    <X className="h-5 w-5" />
  </button>
  ```
- Referenz-Implementierung: `TeamDetailSheet` (Status-Tab, Länder-Sheet),
  `WinnerCelebrationOverlay` Close-Button, `PinGate` PIN-Slots.

### 2.3 K.o.-Runden-Labels

- Mapping in `src/lib/match-phase.ts` → `getStageLabel(stage)`:
  - `group` → „Gruppenphase" (mit Matchday-Suffix)
  - `r32` / `1/16` → **„Sechzehntelfinale"**
  - `r16` / `1/8` → **„Achtelfinale"**
  - `qf` / `1/4` → **„Viertelfinale"**
  - `sf` / `1/2` → **„Halbfinale"**
  - `third` → **„Spiel um Platz 3"**
  - `final` → **„Finale"**
- Wird auf allen Match-Cards (Spiele-Tab, Dashboard, LiveNowBar) und in
  Detail-Sheets angezeigt. API-Kürzel wie `1/16` **immer erst durch das
  Mapping schicken**, nie roh rendern.

### 2.4 Weitere UI-Konventionen

- **LIVE-Badge**: Roter Rahmen + pulsierendes Rot-Badge auf Match-Cards,
  wenn `status === "live"`. Auch im Detail-Sheet.
- **Ampelsystem**: Grün = Top-Spiel (GER, KO ab QF), Gelb = interessant
  (GER-Gruppe, KO ab R16). Konfigurierbar in `categorize.ts`.
- **KO-Banner**: Statischer Header über KO-Match-Cards mit Runden-Emoji.
- **LiveNowBar**: „📺 JETZT IM TV" — horizontale Scroll-Leiste laufender
  Spiele, ganz oben auf dem Spiele-Tab.
- **Empty States**: Klarer Icon+Text+CTA-Button (siehe „Perfect Matches"-
  Empty-State auf dem Dashboard).

---

## 3. Sync-Engine & Bracket-Logik (KO-Phasen)

### 3.1 Phasen-Kaskade

- Aktive Phase = die niedrigste Phase-Nr. mit noch nicht abgeschlossenen
  Spielen. Berechnet in `src/lib/ko-phase.ts` → `PHASE_ORDER` &
  `getActivePhase()`.
- **Prefetch der nächsten Runde**: `getNextPhaseForBracketPrefetch()` gibt
  die nächste Phase zurück, sobald die aktive fast fertig ist. Wird alle
  30 Minuten (`BRACKET_PREFETCH_THROTTLE_MS`) in `useLiveApi.ts`
  aufgerufen, um Bracket-Platzhalter frühzeitig aufzulösen.

### 3.2 Platzhalter-Erkennung

- `isPlaceholderTeam(code)` in `src/lib/ko-phase.ts`. Matched u. a.:
  - `W:73`, `L:101`, `WSF1`, `LQF3` (Sieger/Verlierer eines vorherigen Spiels)
  - `1A`–`3L` (Gruppenerste/zweite/dritte)
- Alles andere gilt als echter Team-Code (`GER`, `FRA`, …).

### 3.3 Upgrade-Pfad (`applyBracketUpgradeFromApi`)

In `src/services/footballApi.ts`. Drei Passes, um Fixtures im Store gegen
API-Daten der Ziel-Phase zu matchen:

1. **Team-Match**: Beide Teams stimmen bereits überein → nur Score/Status
   aktualisieren.
2. **Kickoff ±6 h**: Genau ein Platzhalter-Fixture in derselben Stage mit
   Kickoff im ±6-h-Fenster → Teams übernehmen.
3. **Chronologischer Index**: Verbleibende Fixtures nach Kickoff-Zeit
   sortieren, positionsweise zuordnen.

**Duplikat-Guard** (v7.10.2): Vor Pass 3 werden API-Fixtures nach
sortiertem Team-Paar dedupliziert, und ein Paar darf pro Stage nur einer
Slot-Zeile zugeordnet werden (`pairAlreadyInStage`). Verhindert die
Doppelanzeige „Frankreich vs Marokko" im QF.

### 3.4 Daten-Konsistenz: `apiMatchId` ist der Primary Key

- Beim Upsert in `match_results` **muss** `api_match_id` (int von OpenLigaDB)
  der Konflikt-Key sein. Nur so ersetzt ein Upsert einen Platzhalter-Datensatz
  konsistent, ohne einen zweiten UI-Eintrag zu erzeugen.
- Frontend-Fallback: Sind `apiMatchId`s (noch) nicht bekannt (Rehydrate aus
  localStorage vor erstem API-Sync), fällt `applyLiveFixturesToStore` auf
  Stage-basiertes Bracket-Upgrade zurück (24-h-Kickoff-Fenster).

### 3.5 Zeitzonen- & Zeit-Guard

- Alle Zeiten sind **UTC in der DB**, Anzeige immer via `formatBerlin*` in
  `src/lib/time.ts` (Zone `Europe/Berlin`).
- **Kein hartes Datums-Vergleichen mit `new Date().toDateString()`** —
  Spiele nach Mitternacht deutscher Zeit gehören sonst „gestern".
- Status-Regel (v7.9-Fix): Ein Spiel wird **nur dann als `finished`**
  markiert, wenn die API es explizit meldet **oder** manueller Override
  greift. Ein zukünftiger Kickoff (Kickoff > jetzt) bleibt immer
  `scheduled`, auch wenn ein Score-Feld vorhanden ist — verhindert das
  „Ergebnis wird geladen"-Flackern bei nächtlichen Spielen.

### 3.6 Manuelle Overrides (sticky, aber respektvoll)

- Admin-Override schreibt in `match_overrides` (Score, Status, Phase).
- `manualAt`-Timestamp im Match-Store schützt vor API-Overwrites:
  Solange `manualAt` gesetzt ist, ignoriert `applyUpdateInternal` API-Updates
  komplett. Auflösung: Admin klickt Reset (Mülleimer) **oder** API meldet
  `finished` mit höherem Score.

---

## 4. Supabase Datenbank-Schema

### 4.1 Kern-Tabellen

| Tabelle                       | Zweck                                              |
| ----------------------------- | -------------------------------------------------- |
| `match_results`               | Persistente Match-Daten (Teams, Kickoff, Score, Status, Phase). Konflikt-Key: `api_match_id` |
| `live_fixtures_cache`         | 5-Minuten-Cache pro Phase, Bypass via `force:true` (Throttle im Edge-Fn) |
| `match_overrides`             | Manuelle Score/Phase-Overrides des Admins           |
| `push_subscriptions`          | Web-Push-Endpoints je `client_id`                   |
| `match_alarm_subscriptions`   | User-Alarm für einzelne Matches                     |
| `app_pings`                   | Telemetrie (stabile `client_id`, `last_seen`)        |
| `app_feedback`                | User-Feedback aus dem Feedback-Modal                |
| `error_log`                   | Server-seitige Fehler aus Edge Functions            |

> **`teams`, `stages`, `profiles` sind aktuell nicht als DB-Tabellen
> vorhanden** — sie leben als statische Daten in `src/data/teams.ts`,
> `src/data/groups.ts` und `wm2026_kader.json`. Für die EM-Migration
> optional als Tabellen anlegen, wenn dynamische Squads gewünscht sind.

### 4.2 RLS-Richtlinien

- **Öffentlicher Lesezugriff** (`GRANT SELECT TO anon, authenticated`):
  `match_results`, `live_fixtures_cache`, `match_overrides` (read-only,
  Lock via `supabase/lock_match_overrides.sql`).
- **Nur Service-Role schreibt**: Writes auf Result-Tabellen erfolgen **nur
  aus Edge Functions** mit `SUPABASE_SERVICE_ROLE_KEY`.
- **User-eigene Rows** (`push_subscriptions`, `match_alarm_subscriptions`,
  `app_pings`): RLS filtert auf `client_id = auth.uid()` bzw. die stabile
  Device-ID.
- Anon-Client (Publishable-Key) darf **niemals direkt** in
  `match_overrides` schreiben — das war die Root-Cause der v7.x-Security-
  Findings.

### 4.3 Grants-Muster (jede neue Public-Tabelle!)

```sql
GRANT SELECT ON public.<table> TO anon, authenticated;
GRANT ALL   ON public.<table> TO service_role;
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
-- + Policies
```

---

## 5. Admin-Kontrollzentrum

### 5.1 PIN-Gate

- `PinGate.tsx` → 6-stelliger PIN, Validierung **server-seitig** via
  `admin-override`-Edge-Function (timing-safe compare gegen `ADMIN_PIN`-
  Secret). Kein Client-seitiger PIN-Vergleich mehr.
- Bei Erfolg: PIN nur im lokalen React-State (`AdminPanel.tsx`), niemals
  in localStorage.

### 5.2 Telemetrie

- Tabelle `app_pings` mit **stabiler `client_id`** (`src/lib/device-id.ts`,
  UUID in localStorage, überlebt Reloads).
- Karten im Admin-Dashboard:
  - **Jetzt online**: `last_seen > now() - 5 min`
  - **24 h aktiv**, **7 Tage aktiv**, **Gesamt** (unique client_ids)
- Bot-Filter: User-Agent-Blacklist im Edge-Fn (excluded `googlebot`, `curl`
  usw.).

### 5.3 System-Tab

- **Fetch-Zeitstempel**: Zeigt pro Phase `last_success_at`,
  `last_error_at`, `error_message` aus `live_fixtures_cache` /
  `error_log`.
- **Force-Fetch**: Bypasst den 5-min-Cache. Throttle: 1×/30 s pro Phase
  (in-memory im Edge-Fn).
- **Manueller Gruppensync**: Fetcht Phasen 1–3 sequentiell und upserted
  in `match_results`. Throttle: 1×/60 s.

### 5.4 Live-Override-Panel

- Suchbares Match-Dropdown → Score-Eingabe + Phase-Segmented-Buttons
  („1. HZ", „Pause", „2. HZ", „Verlängerung", „Elfmeter", „Beendet").
- Reset-Button (Mülleimer-Icon) löscht die Row aus `match_overrides` und
  released das `manualAt`-Sticky-Lock im Store.

---

## 6. Endgame-Logik (Weltmeister-Celebration)

Aktiv seit v7.11.0. Trigger: Match mit `stage === "final"` +
`status === "finished"` + entschiedener Score (a ≠ b).

### 6.1 Sieger-Ermittlung

- Hook `src/hooks/useTournamentWinner.ts` liest das Finale aus dem
  Match-Store, prüft Status + Score, ignoriert Platzhalter
  (`isPlaceholderTeam`) und liefert `{ teamCode, team }` (inkl. Flagge +
  Name aus `REAL_TEAMS`).

### 6.2 Einmaliges Gewinner-Popup

- Komponente `src/components/endgame/WinnerCelebrationOverlay.tsx`.
- Vollbild, dunkler Backdrop + Blur. Zentraler Card mit:
  - **Pokal-Icon** (`lucide-react` Trophy in goldenem Kreis mit Glow)
  - Riesige **Flagge** des Siegers
  - Headline **„🏆 [LAND] IST WELTMEISTER 2026!"**
  - Danktext **„Danke, dass du KickTime 2026 für deine WM-Planung und
    Turnier-Begleitung genutzt hast! ❤️"**
- **Konfetti**: 60 farbige Partikel via framer-motion (keine
  `canvas-confetti`-Dependency — pure CSS/motion). Zufällige `left`,
  `delay`, `duration`, Farben aus Palette (Gold, Rot, Blau, Grün, Pink).
- Schließen: X-Button, Backdrop-Klick oder ESC-Taste.

### 6.3 LocalStorage-Sperre

- Key: **`kicktime.endgame.celebrated.v1`** (Wert = Sieger-Code)
- Wird beim Schließen gesetzt → Overlay öffnet sich **nie wieder** auf
  diesem Gerät.
- Für EM 2028 einen neuen Key wählen (z. B. `kicktime.endgame.em2028.v1`),
  damit alte User es erneut sehen.

### 6.4 Hall-of-Fame-Banner

- Komponente `src/components/dashboard/HallOfFameBanner.tsx`.
- **Ersetzt** den `TournamentCountdown` **dauerhaft** auf dem Dashboard,
  sobald ein Sieger feststeht (Logik in `src/routes/index.tsx`:
  `winner ? <HallOfFame/> : <Countdown/>`).
- Design: Goldschimmernder Gradient (yellow-500/amber-400/yellow-600),
  animierter Shine-Loop via `backgroundPosition`.
- Text:
  - Zeile 1: **„👑 Weltmeister 2026: [Flag] [Land]"**
  - Zeile 2: **„Danke für die Nutzung von KickTime!"**

### 6.5 Bewusst NICHT enthalten

- Kein WhatsNew-Eintrag zum Endgame (User-Wunsch).
- Kein Bezug zu Tipps/Wetten.
- Keine externen Sound-Effekte.

---

## 7. Migrations-Guide für die EM 2028 (UK)

Schritt-für-Schritt-Anleitung, um KickTime auf ein neues Turnier
umzustellen. Zielformat: EM 2028 (24 Teams, 6 Gruppen à 4, direkt ins
Achtelfinale — **kein Sechzehntelfinale**).

### 7.1 API-Endpunkte

1. In `supabase/functions/fetch-live-scores/index.ts` alle Vorkommen
   `wm2026` → `em2028` (bzw. der von OpenLigaDB gelieferte Slug —
   verifizieren!).
2. Phasen-Mapping in `src/lib/ko-phase.ts` anpassen:
   - `PHASE_ORDER` von `[1, 2, 3, 4, 5, 6, 7, 8, 9]` auf `[1, 2, 3, 5, 6, 7, 8, 9]`
     (Phase 4 = R32 entfällt).
   - `stageForPhase()`-Mapping: 5 → `r16`, 6 → `qf`, 7 → `sf`, 8 → `third`,
     9 → `final`.
3. `src/lib/match-phase.ts` → `getStageLabel`: „Sechzehntelfinale" aus dem
   Mapping entfernen bzw. deaktivieren.
4. `src/lib/tournament-status.ts`: Group-Cut anpassen (EM: Top 2 direkt +
   4 beste Dritte aus 6 Gruppen).

### 7.2 Daten-Dateien austauschen

| Datei                            | Inhalt                              |
| -------------------------------- | ----------------------------------- |
| `src/data/teams.ts`              | Nur die 24 EM-Teilnehmer            |
| `src/data/groups.ts`             | 6 Gruppen A–F                       |
| `src/data/squads.ts`             | Squad-Slugs                         |
| `src/data/wm2026_kader.json`     | Umbenennen → `em2028_kader.json` + Inhalt |
| `src/data/wm2026_uebertragung.json` | Neue TV-Rechte (UK-fokussiert: BBC/ITV, für DE evtl. MagentaTV + ARD/ZDF) |
| `src/data/world_cup_2026_schedule.json` | Falls Fallback benötigt: neuer EM-Schedule |
| `src/data/ko-static.ts`          | R32-Konstanten entfernen            |

Regex-Search: `wm2026`, `WM 2026`, `Weltmeister`, `2026` → prüfen und
ersetzen.

### 7.3 Branding / Assets / Farben

- `public/manifest.webmanifest`: Name, Kurzname, Theme-Color.
- `public/llms.txt`, `public/robots.txt`: Meta-Text aktualisieren.
- `src/routes/__root.tsx` → `head()`: Title/Description/OG-Meta auf EM
  umstellen.
- `src/lib/accent-themes.ts` / `src/styles.css`: Neue Akzent-Palette
  (z. B. UK Rot/Weiß/Blau).
- Logo & Favicons in `public/` austauschen.

### 7.4 Countdown & Endgame

- `TournamentCountdown.tsx`: Ziel-Datum (Kickoff Eröffnungsspiel) neu
  setzen.
- `HallOfFameBanner.tsx`: Text „Weltmeister 2026" → „Europameister 2028".
- `WinnerCelebrationOverlay.tsx`: Headline analog, Danktext auf „EM 2028"
  anpassen.
- `useTournamentWinner.ts`: Placeholder-Regex prüfen (bleibt kompatibel,
  aber `stage === "final"` unverändert nutzbar).
- **Neuer LocalStorage-Key**: `kicktime.endgame.celebrated.em2028.v1` in
  `WinnerCelebrationOverlay.tsx` — damit User das Popup erneut bekommen.

### 7.5 Datenbank-Reset (Supabase SQL-Editor)

```sql
TRUNCATE TABLE public.match_results        RESTART IDENTITY;
TRUNCATE TABLE public.live_fixtures_cache  RESTART IDENTITY;
TRUNCATE TABLE public.match_overrides      RESTART IDENTITY;
TRUNCATE TABLE public.match_alarm_subscriptions RESTART IDENTITY;
-- Optional (User-Retention):
-- push_subscriptions & app_pings behalten, damit Bestandsuser Push weiter erhalten.
```

### 7.6 Secrets (Supabase Dashboard → Edge Functions → Secrets)

- `ADMIN_PIN` — neu wählen (nie den WM-PIN weiterverwenden).
- `ADMIN_FUNCTION_SECRET` — neu generieren.
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — neu generieren (via
  `web-push generate-vapid-keys`) und `src/lib/push-config.ts`
  aktualisieren.
- `API_FOOTBALL_KEY` — nur falls Fallback-Provider genutzt wird.

### 7.7 Version & Cleanup

- `src/lib/version.ts` auf `8.0.0` bumpen.
- `WhatsNewModal.tsx` und `whatsNew`-Render aktuell **deaktiviert**
  (siehe Root-Route). Für EM entweder komplett entfernen oder neu
  befüllen und Render-Guard wieder aktivieren.
- Alte v7.x-Einträge aus WhatsNew entfernen.
- README/Screenshots aktualisieren.

### 7.8 Test-Checkliste vor Launch

1. `/spiele` zeigt korrekte Gruppen A–F und Achtelfinal-Platzhalter.
2. Force-Fetch aus Admin-Panel funktioniert für Phasen 1–3 + 5.
3. Push-Test-Notification kommt an.
4. `TournamentCountdown` zeigt korrektes Kickoff-Datum.
5. Nach simuliertem Finale (Admin-Override → `finished` mit Sieger):
   Konfetti-Overlay + Hall-of-Fame-Banner erscheinen.
6. Spoilerschutz maskiert Live-Scores korrekt.

---

## Anhang A — Wichtige Dateipfade (Cheat-Sheet)

| Zweck                         | Datei                                                  |
| ----------------------------- | ------------------------------------------------------ |
| Routen                        | `src/routes/*.tsx` (file-based, TanStack)               |
| Root-Layout / SEO / Providers | `src/routes/__root.tsx`                                 |
| Dashboard                     | `src/routes/index.tsx`                                  |
| Match-Store                   | `src/store/match-store.ts`                              |
| App-Store (Settings, Spoiler) | `src/store/app-store.ts`                                |
| Live-Sync-Hook                | `src/hooks/useLiveApi.ts`                               |
| Bracket-Upgrade               | `src/services/footballApi.ts`                           |
| KO-Phasen-Mapping             | `src/lib/ko-phase.ts`                                   |
| Stage-Labels                  | `src/lib/match-phase.ts`                                |
| Standings                     | `src/lib/standings.ts`                                  |
| Team-Status (alive/out)       | `src/lib/tournament-status.ts`                          |
| Endgame Overlay / Banner      | `src/components/endgame/`, `src/components/dashboard/HallOfFameBanner.tsx` |
| Admin-Panel                   | `src/components/admin/*`                                |
| Edge Functions                | `supabase/functions/*/index.ts`                         |
| SQL-Locks                     | `supabase/lock_match_overrides.sql`                     |

## Anhang B — Nicht-verhandelbare Regeln für zukünftige Agenten

1. Niemals `match_overrides` direkt vom Anon-Client schreiben.
2. Niemals einen PIN client-seitig vergleichen — immer via
   `admin-override`-Edge-Function.
3. Niemals `apiMatchId` durch eine erfundene ID ersetzen — Duplikate im UI.
4. Niemals hart auf `toDateString()` vergleichen — nur `formatBerlin*`.
5. Niemals `manualAt`-Locks stillschweigend überschreiben.
6. Niemals Touch-Targets < 48×48.
7. WhatsNew-Modal aktuell deaktiviert — nicht ohne User-Freigabe
   reaktivieren.
