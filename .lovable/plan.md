## Ziel
Erstellung einer einzigen neuen Datei `KICKTIME_ARCHITECTURE.md` im Root-Verzeichnis. Keine bestehende Datei wird verändert, verschoben oder gelöscht.

## Vorgehen
1. Codebase-Analyse (reines Lesen) parallel über:
   - `src/routes/` (Dashboard, Spiele, Status, Turnier, Admin, __root, sitemap)
   - `src/components/` (MatchCard, LiveNowBar, TeamDetailSheet, WinnerCelebrationOverlay, HallOfFameBanner, PinGate, LiveOverridePanel, SystemMonitor, FeedbackModal, PushPermissionModal, PerfectEmptyState)
   - `src/store/match-store.ts`, `src/hooks/useLiveApi.ts`
   - `src/lib/` (ko-phase, tournament-status, match-phase, broadcaster, match-overrides, push-client, footballApi)
   - `supabase/functions/` (fetch-live-scores, admin-override, send-push-reminders)
   - `src/data/` (ko-static, wm2026_uebertragung, wm2026_kader)
2. Schreiben der Datei mit exakt 7 Hauptkapiteln laut Vorgabe.

## Struktur der neuen Datei `KICKTIME_ARCHITECTURE.md`

```text
1. Gesamtkonzept ("Big Picture")
   - Was ist KickTime, Zielgruppe, USP (Perfect Match Algorithmus:
     Interessen + Verfügbarkeit → personalisierte Empfehlungen)
   - Design-Philosophie: Dark-Neon, Mobile-First, Performance
2. Tabs & Features (User-Perspektive)
   2.1 Dashboard (Countdown, Top-Spiel, Perfect-Matches-Empty-State,
       Hall-of-Fame-Banner)
   2.2 Spiele-Tab (Tagesgruppierung, MatchCard-Anatomie, Ampelsystem,
       LIVE-Rahmen, Glocke, Kalender-Export, Runden-Label)
   2.3 Status/Turnier-Tab (Gruppentabellen, 3rd-Place-Logik,
       TeamDetailSheet inkl. Kader/Trainer/FIFA-Rang)
   2.4 Perfect Matches / Tipps (Empty-State-Design)
   2.5 Admin-Kontrollzentrum (PinGate, LiveOverridePanel,
       SystemMonitor, Telemetrie, Force-Fetch, Sync-Groups)
3. UI/UX-Richtlinien & Mobile Guards
   - Globaler Spoilerschutz-Toggle (revealedMatches Persistence)
   - 48×48px Touch-Hitbox-Regel
   - Runden-Label-Mapping (getStageLabel)
   - Broadcaster-Regel (MagentaTV immer, +ARD/ZDF)
4. Sync-Engine & K.-o.-Bracket-Logik
   - match_results als Single Source of Truth
   - Platzhalter-Upsert per matchId, Deduplication
   - Kaskadierender Prefetch /4 → /9, 30min-Throttle
   - Zeitzonen-Guard, manualAt Sticky-Lock
   - 5-Minuten-Cache & Poll-Intervall
5. Tech-Stack, Schema & Datenfluss
   - Vite + TanStack Start + React 19 + Tailwind v4
   - Supabase (Postgres, RLS), Cloudflare Workers
   - OpenLigaDB (wm/2026)
   - Tabellen: match_results, match_overrides, push_subscriptions,
     match_alarm_subscriptions, app_feedback, app_pings, profiles,
     user_roles + RLS-Policies
   - Edge Functions: fetch-live-scores, admin-override,
     send-push-reminders
6. Endgame-Logik
   - Trigger: Runde 9 finished + useTournamentWinner
   - WinnerCelebrationOverlay (canvas-confetti, Pokal, Danksagung)
   - localStorage-Key kicktime.endgame.celebrated.v1
   - HallOfFameBanner ersetzt Countdown
7. Migrations-Guide EM 2028 (UK)
   - API-Route Wechsel wm/2026 → em/2028
   - Phasenstruktur (24 Teams, andere KO-IDs)
   - ko-static.ts, wm2026_uebertragung.json, wm2026_kader.json ersetzen
   - Farb-Theme & Assets (UK-Vibe)
   - DB-Reset-SQL (TRUNCATE match_results, match_overrides, app_pings)
   - Secrets neu setzen (ADMIN_PIN, VAPID)
```

## Nicht-Ziele
- Keine Änderungen an Code, Styles, Migrations oder Konfiguration.
- Kein Deployment, keine Package-Installs.
- WhatsNew wird nicht wieder erwähnt/aktiviert.
