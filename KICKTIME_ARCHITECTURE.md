# 📖 KICKTIME_ARCHITECTURE.md

**System- & Entwickler-Handbuch für KickTime**
Version: v7.11.x (Post-WM-2026 / Endgame-Ready)
Zielgruppe: Menschliche Entwickler *und* zukünftige AI-Agenten, die die App verstehen, warten oder für andere Turniere (EM 2028 UK, WM 2030 etc.) klonen sollen.

> Dieses Dokument ist die **Single Source of Truth** für die Architektur der App. Es beschreibt alles, was der User sieht, was im Hintergrund passiert und wie man KickTime auf ein neues Turnier migriert.

---

## Inhaltsverzeichnis

1. [Gesamtkonzept – The Big Picture](#1-gesamtkonzept--the-big-picture)
2. [Alle Tabs & Features (User-Sicht)](#2-alle-tabs--features-user-sicht)
3. [UI/UX-Richtlinien & Mobile-First Guards](#3-uiux-richtlinien--mobile-first-guards)
4. [Sync-Engine & K.-o.-Bracket-Logik](#4-sync-engine--k-o-bracket-logik)
5. [Tech-Stack, Schema & Datenfluss](#5-tech-stack-schema--datenfluss)
6. [Endgame-Logik & Feierliches Finale](#6-endgame-logik--feierliches-finale)
7. [Migrations-Guide für die EM 2028 (UK)](#7-migrations-guide-für-die-em-2028-uk)

---

## 1. Gesamtkonzept – The Big Picture

### 1.1 Was ist KickTime?

**KickTime** ist eine ultraschnelle, mobile-optimierte Progressive Web App (PWA) zur **Live-Verfolgung, Planung und interaktiven Begleitung von Fußball-Großturnieren** (aktuell: FIFA WM 2026 in USA/Kanada/Mexiko).

Die App richtet sich an Fans, die ihre kostbare Zeit **nicht mit langweiligen Spielen verschwenden** wollen. Statt stumpf alle 104 Spiele der WM zu tracken, kuratiert KickTime den Turnierverlauf individuell für den User.

### 1.2 Das Kernkonzept: „Perfect Matches"

Der **Perfect-Match-Algorithmus** ist das Herzstück der App und läuft in einem einmaligen **Onboarding** (siehe `src/components/onboarding/`):

1. **Interessen-Eingabe:** Der User wählt seine Lieblingsteams (z. B. Deutschland, Brasilien, Argentinien) und Interessens-Kategorien (Top-Nationen, Underdogs, Klassiker, K.-o.-Runden, …).
2. **Zeitfenster-Eingabe:** Der User gibt an, an welchen Wochentagen und zu welchen Uhrzeiten er Zeit hat, Fußball zu schauen (z. B. „Werktags ab 20 Uhr, Wochenende ganztägig").
3. **Matching-Engine:** Die App (`src/lib/categorize.ts`, `src/lib/predictions.ts`) kreuzt beides mit dem Turnierplan und spuckt auf dem **Dashboard** genau die Spiele aus, die der User nicht verpassen darf.

Das Ergebnis: Statt eines überladenen Sportportals bekommt der User eine **persönliche Watch-List**, die sich dynamisch mit dem Turnierverlauf (Gruppenphase → Achtelfinale → Finale) fortschreibt.

### 1.3 Design-Philosophie

- **Dark-Mode-Vibe:** Tiefes Neonschwarz mit akzentfarbenen Highlights (turnier-spezifische Akzent-Themes in `src/lib/accent-themes.ts`).
- **Mobile-First:** Jede Interaktion ist für den Daumen optimiert (siehe Kapitel 3).
- **Extrem schlank & performance-orientiert:** Kein Framework-Overhead, kein Serverless-Bloat. Der Erst-Render passiert SSR-gerendered auf Cloudflare Workers, danach übernimmt der Client mit einem lokal persistierten Zustand (Zustand-Store + `localStorage`).
- **Zero-Spoiler-DNA:** Ergebnisse werden nur gezeigt, wenn der User es explizit möchte. Der Spoilerschutz ist **kein Feature**, sondern eine **Grundhaltung**.

---

## 2. Alle Tabs & Features (User-Sicht)

Die App hat eine feste Bottom-Navigation mit den Haupt-Routen (`src/routes/`). Jeder Tab hat eine klar definierte Aufgabe.

### 2.1 Dashboard-Tab (`/` → `src/routes/index.tsx`)

Der **persönliche Kommandostand** des Users.

- **Countdown-Banner (vor Turnierstart):** Live-Countdown bis zum Eröffnungsspiel (Tage / Stunden / Minuten / Sekunden).
- **Nächstes Top-Spiel (Turnier läuft):** Große Hero-Karte mit dem für den User relevantesten kommenden Spiel (basierend auf Perfect-Match-Score).
- **Perfect Matches – Empty-State:** Wenn die aktuelle Phase komplett gespielt ist, erscheint statt einer leeren Liste ein **freundlicher Empty-State** (`PerfectEmptyState` in `src/routes/index.tsx`):
  - `CheckCircle2`-Icon (Häkchen, akzentfarben)
  - Text: *„Alle Spiele dieser Phase abgeschlossen"*
  - CTA-Button **„Zu den Spielen"** → leitet in den Spiele-Tab
- **Quick-Infos:** Push-Status, offene Alarme, Perfect-Match-Zähler.
- **Hall of Fame-Banner (nach dem Finale):** Ersetzt automatisch den Countdown, sobald das Finale (Runde 9) den Status `finished` hat. Zeigt den Weltmeister in Gold-Shimmer (`src/components/endgame/HallOfFameBanner.tsx`).

### 2.2 Spiele-Tab (`/spiele` → `src/routes/spiele.tsx`)

Der **komplette Turnierplan**, chronologisch sortiert.

- **Tagesgruppierung:** Spiele sind pro Kalendertag gruppiert (deutsche Locale, „Heute" / „Morgen" / Wochentag + Datum).
- **Filter-Chips:** *Alle · Meine Teams · Besondere Spiele (Top) · Gelbes Ampel-Level (Interessant)*.
- **LiveNowBar** (`src/components/match/LiveNowBar.tsx`): Sticky-Bar mit **„📺 JETZT IM TV"**-Sektion, wenn gerade Spiele laufen. Auto-Scroll zum nächsten anstehenden Spiel.
- **Match Card-Anatomie** (`src/components/match/MatchCard.tsx`):
  - **Team-Flaggen** (Emoji-basiert) + Team-Codes
  - **Turnier-Runde als Label** (siehe `getStageLabel` in `src/lib/match-phase.ts`): „Gruppenphase", „Sechzehntelfinale", „Achtelfinale", „Viertelfinale", „Halbfinale", „Finale"
  - **Anstoßzeit** (lokale Zeit, Zeitzonen-sicher)
  - **Sender-Anzeige** mit 📺-Icon (immer **MagentaTV**; wenn ARD/ZDF im Free-TV läuft: „MagentaTV & ARD" / „MagentaTV & ZDF" – siehe `src/lib/broadcaster.ts`)
  - **Spielort / Stadion**
  - **Ampelsystem** (Farbrahmen):
    - 🟢 Grün = Top-Spiel (User-Team oder K.-o.-Runde)
    - 🟡 Gelb = Interessant
    - Neutral = Rest
  - **LIVE-Rahmen:** Roter, pulsierender Rand + LIVE-Badge + Spielphase (**1. Halbzeit / Halbzeit / 2. Halbzeit / Verlängerung / Elfmeterschießen**) statt Minutenanzeige
  - **Ergebnis-Rendering:**
    - Zukünftige Spiele: Nur Anstoßzeit, kein „0:0" (Bugfix v7.9)
    - Live: Aktueller Zwischenstand (respektiert Spoilerschutz)
    - Abgeschlossen ohne API-Daten: **„-:-"** statt fälschlichem „0:0"
  - **Benachrichtigungs-Glocke** 🔔 → legt einen persönlichen Match-Alarm an (Web-Push)
  - **„Zum Kalender hinzufügen"-Button** → generiert eine `.ics`-Datei (`src/lib/calendar.ts`)
- **Detail-Sheet** (Klick auf Karte): Vollbild-Sheet mit Aufstellung-Platzhalter, Sender, LIVE-Status, Live-Phase.

### 2.3 Status / Turnier-Tab (`/turnier` → `src/routes/turnier.tsx`)

Das **interaktive Turnierbuch** – „Wer ist noch drin?".

- **Gruppen-Tabellen** (Punkte, Tore, Differenz) – berechnet aus `match_results` in `src/lib/standings.ts`.
- **3rd-Place-Logik** (WM-2026-Format, `src/lib/tournament-status.ts`): Sobald alle 12 Gruppen fertig sind, werden die 8 besten Gruppendritten als „weiter" markiert; die 4 schlechtesten sind **ausgeschieden** und werden entsprechend in Status/Filter gefiltert (Bugfix v7.10.3).
- **Länder-Kacheln:** Jede Nation als Karte mit Status-Badge (weiter / raus / K.-o.-Runde-XY).
- **Team-Detail-Sheet** (`src/components/team/TeamDetailSheet.tsx`) – öffnet beim Klick auf ein Land:
  - Flagge, FIFA-Rang, WM-Titel-Historie
  - Trainer + Trainer-Nationalität
  - **Kompletter Kader** (Lazy-Import aus `src/data/wm2026_kader.json`, ~5.4k Zeilen)
  - Modernes Dark/Neon-Design mit sanften Framer-Motion-Übergängen
  - **Schließen-Button:** kleines eleganter „X"-Icon, aber **48×48 px Touch-Hitbox** (siehe Kapitel 3)

### 2.4 Tipps-Tab (`/tipps` → `src/routes/tipps.tsx`)

Der User kann pro Spiel eine **Tipp-Vorhersage** abgeben. Der Tipp-Score wird ausgewertet, sobald das Spiel offiziell beendet ist. Auch hier gilt: Wenn die aktuelle Phase komplett fertig ist, erscheint derselbe `PerfectEmptyState` wie im Dashboard.

### 2.5 Tabellen-Tab (`/tabellen` → `src/routes/tabellen.tsx`)

Klassische Turnier-Tabellen (Gruppen A–L bei WM 2026), inklusive Torschützenliste (falls Daten vorhanden). Rein statistische Sicht auf `match_results`.

### 2.6 Profil-Tab (`/profil` → `src/routes/profil.tsx`)

- Onboarding-Präferenzen editieren (Teams, Interessen, Zeitfenster).
- Push-Benachrichtigungen an/aus (globaler Kill-Switch, siehe v7.2).
- Feedback geben.
- Spoilerschutz-Grundeinstellung.

### 2.7 Admin-Kontrollzentrum (Overlay, nicht im Menü)

Aktivierbar über einen versteckten Trigger + **PIN-Gate** (`src/components/admin/PinGate.tsx`). Die PIN wird **serverseitig** im Edge-Function-Secret `ADMIN_PIN` gehalten – **niemals** im Client-Code (Security-Fix nach Finding `admin_pin_hardcoded`).

Sub-Tabs im Admin-Panel:

- **Live-Override** (`LiveOverridePanel.tsx`):
  - Spiel auswählen → Score manuell setzen (`is_manual` Flag)
  - **Phasen-Buttons** statt Minutenanzeige (1. HZ / Pause / 2. HZ / Verlängerung / Elfmeter / Beendet)
  - **Reset-Button 🗑️** entfernt den Override und gibt die API-Daten frei
  - Overrides schreiben über die Edge Function `admin-override` (Service-Role-Rechte, keine direkten anon-Writes) in die Tabelle `match_overrides`
- **System-Monitor** (`SystemMonitor.tsx`):
  - Live-Statistik der aktiven OpenLigaDB-Route (aktuell z. B. `/4` für Sechzehntelfinale)
  - **⚡ Force-Fetch**-Button (v7.9): erzwingt sofortigen API-Poll unter Umgehung des 5-Minuten-Caches
  - **„Gruppenphase manuell synchronisieren"**: reseeded historische Gruppenergebnisse (verhindert Datenverlust beim Phasenwechsel)
  - **All-Inclusive-Fehler-Log:** letzte Edge-Function-Fehler + Frontend-Errors (`src/lib/error-log.ts`)
- **Telemetrie** (`app_pings`):
  - „JETZT ONLINE" (5 min), „24 h", „7 Tage", „GESAMT" – zählt **echte Browser-Sessions** über eine stabile `client_id` in `localStorage` (`src/lib/telemetry.ts`), Bots werden per User-Agent-Filter ausgeschlossen.

---

## 3. UI/UX-Richtlinien & Mobile-First Guards

### 3.1 Globaler Spoilerschutz-Toggle

- Im Header (App-übergreifend). State in `src/store/app-store.ts` → `revealedMatches: Set<matchId>` mit **persistenter Speicherung** in `localStorage` (Bugfix v6.0.
- Bei Toggle „Spoiler verstecken" werden alle Scores in MatchCards und Detail-Sheets ausgegraut/durch `•:•` ersetzt.
- Klick auf einen einzelnen Score „enthüllt" das Ergebnis dauerhaft für dieses Match (globaler Sync zwischen Spiele-Tab und Detail-Sheet, Bugfix v6.2).

### 3.2 Touch-Hitbox-Regel (48×48 px Minimum)

**Verpflichtend** für jeden Close-/Aktions-Button, insbesondere:
- „X"-Kreuz im `TeamDetailSheet`
- „X"-Kreuz in Feedback-, Push-Permission-, Winner-Overlay-Modals

Technik: Icon bleibt optisch klein (z. B. 20×20 px), umschlossen von einem transparenten Klickbereich mit `min-width: 48px; min-height: 48px`. Kein Sichtbarkeits-Trade-off, aber wesentlich fettfingerfreundlicher.

### 3.3 Runden-Labels (Stage-Mapping)

Rohdaten der OpenLigaDB kommen als `groupOrderID` bzw. `matchGroupName` in kryptischer Form (`1/8`, `1/4`, `Round of 32`, …). Die zentrale Funktion `getStageLabel(match)` in `src/lib/match-phase.ts` mappt:

| API-Wert                | Klarname (DE)      |
|-------------------------|--------------------|
| Vorrunde / groupOrderID 1 | Gruppenphase       |
| Round of 32 / 1/16      | Sechzehntelfinale  |
| Round of 16 / 1/8       | Achtelfinale       |
| Quarter-finals / 1/4    | Viertelfinale      |
| Semi-finals / 1/2       | Halbfinale         |
| Third place             | Spiel um Platz 3   |
| Final                   | Finale             |

Dieses Mapping **muss** bei jedem Turnier-Klon angepasst werden.

### 3.4 Broadcaster-Regel

`src/lib/broadcaster.ts` erzwingt: **jedes Spiel** hat mindestens „MagentaTV". Zusätzlich (aus `wm2026_uebertragung.json`) wird bei parallel laufender Free-TV-Übertragung angehängt: `„MagentaTV & ARD"` oder `„MagentaTV & ZDF"`.

### 3.5 Layout-Schutz

- **🏆-Icon** als visueller Platzhalter für noch-nicht-entschiedene K.-o.-Paarungen („Sieger Spiel 73" bleibt sichtbar, damit das Layout stabil ist).
- Kein Layout-Shift beim Ersetzen der Platzhalter durch echte Teams (gleiche Card-Höhe, gleiche Grid-Zellen).

### 3.6 Haptics & Feedback

`src/lib/haptics.ts` triggert dezente Vibrations-Feedbacks auf iOS/Android (Bell-Toggle, Reveal, Reset).

---

## 4. Sync-Engine & K.-o.-Bracket-Logik

### 4.1 Datenquelle & Cache

- **API:** OpenLigaDB, aktuell Base-URL `https://api.openligadb.de/getmatchdata/wm/2026`, für K.-o.-Phasen `/wm/2026/<phaseId>` (Sechzehntelfinale = `4`, Achtelfinale = `5`, …, Finale = `9`).
- **Cache:** Edge Function `fetch-live-scores` hält jede Route für **exakt 5 Minuten** im Memory (`Cache-Control: s-maxage=300`).
- **Poll-Intervall im Frontend:** `LIVE_POLL_MS = 5 * 60 * 1000` (siehe `src/hooks/useLiveApi.ts`).
- **Force-Fetch:** Admin kann den Cache pro Route über Query-Parameter `?force=true` umgehen (per In-Memory-Throttle gegen Missbrauch geschützt).

### 4.2 `match_results` als Single Source of Truth

Ein früherer Bug führte dazu, dass beim Phasenwechsel alte Ergebnisse aus dem State „vergessen" wurden. Lösung:

1. Die Edge Function **upsertet** jede API-Antwort additiv in die Supabase-Tabelle `match_results` (auf `match_id`).
2. Das Frontend liest **ausschließlich** aus `match_results` – nicht mehr direkt aus der API.
3. Beim Wechsel von Route `/4` auf `/5` bleiben die alten `/4`-Ergebnisse im DB-Bestand.

### 4.3 Manuelle Overrides (Sticky-Lock)

Tabelle `match_overrides` (siehe Kapitel 5) enthält Admin-gesetzte Scores + Phase.

Merge-Regel in `src/store/match-store.ts` (`applyUpdateInternal`):

- Wenn `manualAt` gesetzt: **API-Updates werden verworfen**, außer die API meldet ein **höheres Ergebnis** oder Status `finished` (v6.1-Regel).
- Reset über Admin-🗑️-Button entfernt `manualAt` und die Override-Zeile → API übernimmt wieder.

Zusätzlich verhindert `lastApiSignature` (v7.0.1) den „Blink-Bug", bei dem Stale-API-Payloads kurz das Live-Ergebnis überschrieben.

### 4.4 K.-o.-Bracket-Upsert & Platzhalter-Ersetzung

Problem: Sechzehntelfinal-Paarungen werden **vor** Abschluss der Gruppenphase mit Platzhaltern („Sieger Gruppe A", „Zweiter Gruppe B") erstellt (statisch in `src/data/ko-static.ts`). Sobald die OpenLigaDB die echten Teams auf `/wm/2026/4` liefert, müssen diese Karten **inplace** aktualisiert werden – **ohne Duplikate**.

Kern-Mechanik (`src/lib/ko-phase.ts` + `runBracketPrefetch` in `src/hooks/useLiveApi.ts`):

1. **Kaskadierender Prefetch:** Alle 30 Minuten (Throttle) werden zukünftige K.-o.-Routen `/4 … /9` sequenziell abgerufen (`upgradeActivePhase` bezieht auch die aktuell aktive Phase mit ein, v7.10.1).
2. **Matching-Strategie in `applyBracketUpgradeFromApi`:**
   - Primär: gleiche `matchId` → einfacher Upsert.
   - Fallback: **24-h-Kickoff-Fenster** + sortierte Team-Code-Deduplication (verhindert die Frankreich–Marokko-Duplizierung aus v7.10.2).
   - `pairAlreadyInStage`-Guard blockt eine zweite Karte mit derselben Team-Kombination in derselben Stage.
3. **Sechzehntelfinale bleibt hardcoded** (v7.6): Statische R32-Paarungen aus `ko-static.ts` sorgen dafür, dass die Bracket-Vorschau schon vor API-Daten sichtbar ist. Sobald die API `/4` liefert, werden die Platzhalter überschrieben.

### 4.5 Zeitzonen-Guard

Nächtliche Spiele (z. B. Anstoß 01:00 Uhr MEZ) haben regelmäßig zu Statusfehlern geführt (`abgeschlossen` statt `bevorstehend`). Der Guard in `src/lib/match-phase.ts` erzwingt einen `now < kickoff - 60s`-Vergleich auf Basis von `Date.now()` (UTC-safe), bevor irgendein „live"- oder „finished"-Status berechnet wird (Bugfix v7.9).

### 4.6 Phasengesteuertes Dashboard

`PHASE_ORDER` in `src/lib/ko-phase.ts` bestimmt, welche Phase aktuell auf dem Dashboard gezeigt wird. Sobald **alle** Spiele einer Phase `finished` sind, springt das Dashboard automatisch auf die nächste (Gruppe → R32 → R16 → …).

---

## 5. Tech-Stack, Schema & Datenfluss

### 5.1 Stack

| Schicht        | Technologie                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Runtime        | Cloudflare Workers (SSR + Edge Functions) mit `nodejs_compat`               |
| Framework      | TanStack Start v1 (React 19) + TanStack Router (file-based)                 |
| Build          | Vite 7                                                                      |
| Styling        | Tailwind CSS v4 (native `@theme` in `src/styles.css`)                       |
| State          | Zustand-Store (`src/store/*.ts`) mit `persist`-Middleware auf `localStorage` |
| Data-Fetching  | TanStack Query + `createServerFn`                                           |
| Datenbank      | Supabase (PostgreSQL + RLS + pg_cron)                                       |
| Push           | Web Push API (VAPID) über Service Worker `public/sw.js`                     |
| Datenquelle    | OpenLigaDB (`api.openligadb.de/getmatchdata/wm/2026[/<phaseId>]`)           |

### 5.2 Supabase-Schema (öffentlich relevante Tabellen)

Alle Tabellen liegen in `public` und **müssen** `GRANT`s auf `authenticated` / `anon` (bei public-read) + `service_role` haben. RLS ist auf allen Tabellen `ENABLE`d.

| Tabelle                     | Zweck                                                                                         |
|-----------------------------|-----------------------------------------------------------------------------------------------|
| `match_results`             | Kanonische Ergebnisse (upserted von der Edge Function). Public-read via anon.                 |
| `match_overrides`           | Admin-Overrides (Score + Phase + `manual_at`). Writes NUR über `admin-override` Edge Function.|
| `push_subscriptions`        | Web-Push-Endpoints der User (VAPID).                                                          |
| `match_alarm_subscriptions` | Persönliche Match-Alarme (User × Match).                                                      |
| `app_feedback`              | Feedback-Modal-Antworten (alle 8 Öffnungen).                                                  |
| `app_pings`                 | Telemetrie-Pings mit stabiler `client_id`.                                                    |
| `profiles`                  | User-Profil (Präferenzen, Zeitfenster).                                                       |
| `user_roles`                | Rollen (`admin`, `moderator`, `user`) – gecheckt via `has_role()` SECURITY DEFINER Function.  |

### 5.3 Edge Functions

Alle unter `supabase/functions/`:

- **`fetch-live-scores`**
  - Ruft OpenLigaDB ab (Route wird über Query-Param `phase` bestimmt).
  - 5-min In-Memory-Cache pro Route.
  - Upsertet `match_results` additiv.
  - Merged `match_overrides` on-the-fly (Regel: API gewinnt bei höherem Score oder `finished`).
  - `?force=true` + `?sync-groups=true` sind mit einem **Authorization-Header-Check** + Throttle gesichert.
- **`admin-override`**
  - Einziger Schreib-Pfad für `match_overrides`.
  - Validiert die PIN (Env `ADMIN_PIN`) und nutzt Service-Role-Key intern.
  - Deployed als `--no-verify-jwt`, weil die eigene PIN-Validierung greift.
- **`send-push-reminders`**
  - Von `pg_cron` alle Minute getriggert.
  - Findet fällige Alarme (`match_alarm_subscriptions`), baut **dynamische Push-Inhalte** (Team-Namen, Anstoßzeit) und feuert Web-Push via VAPID.

### 5.4 Datenfluss (High-Level)

```text
OpenLigaDB
    │  (HTTPS, 5-min Cache)
    ▼
Edge Function `fetch-live-scores`
    │  upsert (additiv)
    ▼
Supabase.match_results  ◄──── Edge Function `admin-override` ◄── Admin-Panel (PIN)
    │                             (schreibt match_overrides)
    │  (TanStack Query, 5-min Poll)
    ▼
Zustand-Store `match-store`  ── merged mit match_overrides (Sticky-Lock)
    │
    ▼
React-UI (MatchCard, Dashboard, TeamDetailSheet, …)

Parallel:
pg_cron ──▶ `send-push-reminders` ──▶ Web Push ──▶ Service Worker `sw.js`
```

### 5.5 RLS-Grundregeln

- `match_results`, `match_overrides`: **SELECT** für `anon` + `authenticated`, **INSERT/UPDATE/DELETE** nur `service_role`.
- `match_alarm_subscriptions`, `push_subscriptions`, `profiles`: nur eigener `auth.uid()`.
- `user_roles`: SELECT für `authenticated`, kein direktes Schreiben, Prüfung ausschließlich über `public.has_role()`.

---

## 6. Endgame-Logik & Feierliches Finale

Sobald das Finale (`stage = Final`, `phaseId = 9`) den Status `finished` erreicht, aktiviert die App den **Endgame-Modus** (v7.11.0).

### 6.1 Trigger

`src/hooks/useTournamentWinner.ts` liefert:

```ts
{ winner: { code: 'ARG', name: 'Argentinien', flag: '🇦🇷' } | null,
  isFinished: boolean }
```

Sobald `isFinished === true` und `winner !== null`, wird der Endgame-Flow aktiv.

### 6.2 Einmaliges Winner-Popup

`src/components/endgame/WinnerCelebrationOverlay.tsx`:

- **`canvas-confetti`** in Nationalfarben des Weltmeisters (Multi-Burst über ~4 s).
- **Goldener Pokal** (Lucide `Trophy`, Amber-Gradient).
- Dynamischer Text: *„🏆 Weltmeister 2026: {Land}"*.
- **Danksagung** an den User für die Turnier-Treue und Nutzung der Perfect-Match-Planung.
- **Schließen-Button** mit 48×48-Hitbox.
- **LocalStorage-Sperre:** Key `kicktime.endgame.celebrated.v1` verhindert, dass das Popup beim nächsten App-Start erneut auftaucht. Der User kann es manuell aus dem Profil-Tab zurücksetzen (Debug).

### 6.3 Permanenter „Hall of Fame"-Banner

`src/components/endgame/HallOfFameBanner.tsx`:

- Ersetzt **permanent** den Countdown-/Top-Spiel-Slot im Dashboard.
- Goldener Shimmer-Gradient (CSS-Keyframe), Pokal-Icon, Weltmeister-Land + Flagge, Turnier-Jahr.
- Für alle Folge-Sessions sichtbar, bis das nächste Turnier via Migrations-Guide neu geseeded wird.

### 6.4 WhatsNew ist deaktiviert

`WhatsNewModal` wird in `src/routes/__root.tsx` per Falsy-Guard **nicht** gerendert. Der Endgame-Flow ist die einzige Bühne nach dem Finale.

---

## 7. Migrations-Guide für die EM 2028 (UK)

Klonen der App für ein neues Turnier in fünf klaren Schritten.

### 7.1 API-Route umstellen

In **`supabase/functions/fetch-live-scores/index.ts`** die Basis-URL anpassen:

```ts
// vorher (WM 2026):
const UPSTREAM_BASE = "https://api.openligadb.de/getmatchdata/wm/2026";

// nachher (EM 2028):
const UPSTREAM_BASE = "https://api.openligadb.de/getmatchdata/em/2028";
```

Ebenso das Frontend-Wording und `TOURNAMENT_ID` (falls verwendet) in `src/lib/version.ts` / `src/lib/tournament-status.ts`.

### 7.2 Phasenstruktur anpassen

Die WM 2026 hat 12 Gruppen + Sechzehntelfinale (`/4`), Achtelfinale (`/5`), …, Finale (`/9`).
Die EM 2028 (aktueller UEFA-Plan) hat **24 Teams** mit anderer K.-o.-Struktur:

- `PHASE_ORDER` in `src/lib/ko-phase.ts` überarbeiten.
- Phasen-Labels in `src/lib/match-phase.ts` (`getStageLabel`) für neue API-Keys ergänzen.
- Statische R16-Paarungen in `src/data/ko-static.ts` durch die neue Bracket-Struktur der EM ersetzen (oder ganz entfernen, wenn nicht mehr benötigt).
- 3rd-Place-Logik in `src/lib/tournament-status.ts` an das EM-Format anpassen (bei 24 Teams: die 4 besten Gruppendritten).

### 7.3 Datendateien austauschen

- `src/data/wm2026_uebertragung.json` → `em2028_uebertragung.json` (TV-Sender: bei EM meist ARD/ZDF/MagentaTV mit anderem Split).
- `src/data/wm2026_kader.json` → `em2028_kader.json` (nur teilnehmende Nationen).
- `src/data/groups.ts`, `src/data/teams.ts`, `src/data/matches.ts` neu befüllen.
- `broadcaster.ts` prüfen: MagentaTV-Regel gilt für die EM **nicht automatisch** – ggf. auf ARD/ZDF-Default umstellen.

### 7.4 Assets & Farb-Theme auf UK-Vibe

- `src/lib/accent-themes.ts`: neues Theme (z. B. Union-Jack-Rot/Blau, oder ein modernes „UK Summer Neon").
- Favicon / PWA-Icons / Splash in `public/` austauschen.
- Turnier-Logo im Header / Dashboard aktualisieren.

### 7.5 Datenbank leeren & neu seeden

```sql
-- ACHTUNG: entfernt ALLE Turnier-spezifischen Daten.
TRUNCATE public.match_results       RESTART IDENTITY CASCADE;
TRUNCATE public.match_overrides     RESTART IDENTITY CASCADE;
TRUNCATE public.match_alarm_subscriptions RESTART IDENTITY CASCADE;
TRUNCATE public.app_pings           RESTART IDENTITY CASCADE;
TRUNCATE public.app_feedback        RESTART IDENTITY CASCADE;
```

Danach:

1. Secrets neu setzen (`ADMIN_PIN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) über das Supabase-Dashboard.
2. Edge Functions redeployen (`fetch-live-scores`, `admin-override`, `send-push-reminders`).
3. `pg_cron`-Job für `send-push-reminders` neu einrichten.
4. Endgame-LocalStorage-Key **umbenennen** (`kicktime.endgame.celebrated.v1` → `.v2`), damit alle User beim EM-Finale erneut die Feier sehen.

### 7.6 Smoke-Test-Checkliste

- [ ] Onboarding fragt Interessen + Zeitfenster korrekt ab.
- [ ] Dashboard zeigt Countdown auf EM-Eröffnungsspiel.
- [ ] Spiele-Tab listet alle EM-Spiele mit korrekten Sendern.
- [ ] MatchCard-Runden-Label zeigt „Gruppenphase" / „Achtelfinale" etc.
- [ ] Admin-Panel PIN-Login funktioniert (neuer `ADMIN_PIN`).
- [ ] Push-Notification-Testalarm kommt an.
- [ ] Nach Simulation eines Finales: Winner-Overlay + Hall-of-Fame-Banner erscheinen.

---

**Ende des Dokuments.** Jede zukünftige Erweiterung von KickTime **muss** dieses Handbuch synchron halten. Wenn ein Feature/Tabellen-Schema/Flow sich ändert, wird dieses Dokument im selben Commit aktualisiert.
