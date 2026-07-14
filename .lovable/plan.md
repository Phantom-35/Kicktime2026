# Plan: Architektur-Dokumentation & WhatsNew-Deaktivierung

## 1. Neue Datei: `KICKTIME_ARCHITECTURE.md` (Root)

Vollständiges Entwickler-Handbuch als Markdown, strukturiert nach den 7 vorgegebenen Abschnitten. Keine bestehenden Code-Dateien werden angefasst — reine Doku.

### Struktur

1. **Systemübersicht & Tech-Stack**
   - Vite 7 + React 19 + TanStack Start/Router, Tailwind v4, Zustand (Match- & App-Store), framer-motion
   - Supabase (Postgres, RLS, Edge Functions Deno), Cloudflare Worker als Runtime für SSR/Server-Fn
   - OpenLigaDB (`api.openligadb.de/getmatchdata/wm2026/<phase>`) als primäre Live-Quelle, Phasen 1–9
   - Datenfluss-Diagramm (ASCII): OpenLigaDB → Edge Function `fetch-live-scores` → Postgres (`match_results`, `live_fixtures_cache`) → Frontend (`useLiveApi` → `match-store`)

2. **UI/UX & Mobile-First Design**
   - Spoilerschutz: globaler `revealedMatches`-Set im `app-store` (persist), Header-Toggle, Regeln in `spiele.tsx`/`MatchDetailSheet`
   - Touch-Hitbox 48×48 (CSS-Padding, sichtbares Icon klein) — Referenz `TeamDetailSheet`-Close
   - Stage-Label-Mapping (`getStageLabel` in `match-phase.ts`): `1/16→Sechzehntelfinale` … `Finale`
   - Ampelsystem, KO-Banner, LiveNowBar, LIVE-Badge

3. **Sync-Engine & Bracket-Logik**
   - Phasen-Kaskade via `getNextPhaseForBracketPrefetch` (30 min Throttle)
   - Platzhalter-Erkennung: `isPlaceholderTeam` (`W:73`, `L:101`, `3A`…)
   - Upgrade-Pfad: `applyBracketUpgradeFromApi` — 3 Passes (Team-Match, Kickoff ±6h, Chronologischer Index) + Duplikat-Guard
   - `apiMatchId` als Primary Key beim Upsert in `match_results` → verhindert Duplikate
   - Zeit-Guard: `status === finished` nur wenn API es explizit sagt, sonst kickoff-basiert; nächtliche Spiele bleiben `scheduled` bis API `finished` liefert (Fix aus v7.9)

4. **Supabase Schema**
   - Tabellen: `match_results`, `live_fixtures_cache`, `match_overrides`, `push_subscriptions`, `match_alarm_subscriptions`, `app_pings`, `app_feedback`, `error_log`
   - RLS: Public READ auf Ergebnisse/Cache; Writes nur via Edge Functions mit Service-Role; `match_overrides` ist READ-ONLY für anon (siehe `lock_match_overrides.sql`)
   - Grants pro Tabelle dokumentiert

5. **Admin-Kontrollzentrum**
   - PIN-Gate (server-side Validation via `admin-override` Edge Function, `ADMIN_PIN` Secret)
   - Telemetrie (`app_pings` mit stabiler `client_id`): Online 5 min / 24 h / 7 d / Gesamt
   - System-Tab: Fetch-Zeitstempel, Error-Log, Force-Fetch (Cache-Bypass 30s Throttle), Sync-Groups (60s Throttle)
   - Live-Override-Panel: Phasen-Auswahl, Reset (Mülleimer)

6. **Endgame-Logik** (aktuell v7.11.0)
   - Trigger: Match mit `stage==='final'` & `status==='finished'` & Sieger-Score
   - `useTournamentWinner` Hook → resolves `{teamCode, team}`
   - `WinnerCelebrationOverlay`: Konfetti (framer-motion, keine Lib), Pokal, Flagge, Danktext
   - LocalStorage-Key `kicktime.endgame.celebrated.v1` (statt `has_seen_winner_popup`, aktueller Key dokumentiert)
   - `HallOfFameBanner` ersetzt `TournamentCountdown` dauerhaft

7. **Migrations-Guide EM 2028 (UK)**
   - API-Endpunkte: `wm2026` → `em2028`; Phasen 1–9 → EM hat kein R32 (Phasen-Mapping in `ko-phase.ts` anpassen, `PHASE_ORDER` kürzen)
   - `src/data/teams.ts`, `groups.ts`, `squads.ts`, `wm2026_kader.json`, `wm2026_uebertragung.json` austauschen
   - Assets/Accent-Farben (`accent-themes.ts`, `styles.css`), Branding (Logo, Manifest, `llms.txt`, Root-Head)
   - DB-Reset: TRUNCATE `match_results`, `live_fixtures_cache`, `match_overrides`, `match_alarm_subscriptions`; `push_subscriptions` optional behalten
   - Countdown-Ziel (`TournamentCountdown`), Version reset, WhatsNew-Historie leeren
   - `HallOfFameBanner`-Text („Weltmeister 2026" → „Europameister 2028"), `useTournamentWinner`-Placeholder-Regex prüfen
   - Secrets in Supabase: `API_FOOTBALL_KEY`/OpenLigaDB-Endpunkt, `ADMIN_PIN`, VAPID neu generieren

## 2. WhatsNew-Sheet komplett deaktivieren

- `src/components/whats-new/WhatsNewModal.tsx` intakt lassen, aber nirgends mehr rendern.
- Aufrufstelle finden (vermutlich `src/routes/__root.tsx` oder `src/routes/index.tsx`) — mit `rg "WhatsNew"` verifizieren — und den Render-Call sowie ggf. den Auto-Open-State entfernen/auskommentieren.
- Import zusätzlich entfernen, damit Bundle sauber bleibt.
- Keine Version-Bump nötig (reine UI-Deaktivierung).

## Technische Details

- Reiner Dokumentations-Task für Datei 1; Datei 2 ist eine minimale Entfernung des WhatsNew-Renders (1 Datei, 2–4 Zeilen).
- Keine neuen Dependencies, keine Schema-Änderungen, keine Edge-Function-Deploys.
- Nach dem Edit: Typecheck läuft automatisch.
