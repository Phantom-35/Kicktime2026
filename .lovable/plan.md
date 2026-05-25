## Goal

Refactor the live-data architecture to be production-ready: remove the fake demo button, drive everything from real system time, scaffold a real API-Football service layer (with secure env-var key handling), and replace the demo button with a developer-only simulation toggle in Settings.

## Phase 1 — Real-time architecture

### 1.1 Remove demo button
- `src/routes/index.tsx`: delete the "Demo: Zeit +2h vorspulen" `Button`, its `tickClock` import, and the unused `FastForward` icon.

### 1.2 Real-time match expiry & rolling refresh
- `src/store/match-store.ts`:
  - Seed `now` from `Date.now()` (not the hardcoded `DEMO_NOW`).
  - Add `syncWithRealTime()` action: reads `Date.now()`, walks matches, and flips `scheduled → live` (kickoff reached) and `live/scheduled → finished` (kickoff + 115 min reached). Mirrors current `tickClock` logic but uses absolute wall-clock time.
  - Keep `applyLiveUpdate` / `finishMatch` for external feeds.
- `src/routes/__root.tsx` (or a new `useLiveClock` hook mounted there): run `setInterval(syncWithRealTime, 10000)` once at app root, plus an initial call on mount. Clean up on unmount.
- `categorizeMatches` already uses `now` + 110 min cutoff; switch to reading `Date.now()` directly so the rolling "Nachrücken" effect happens automatically as the interval fires.

### 1.3 API service scaffold
- New `src/services/footballApi.ts`:
  - Top-of-file comment block documenting how to plug in API-Football (`https://v3.football.api-sports.io/fixtures?league=1&season=2026`, `x-apisports-key` header) and `import.meta.env.VITE_API_FOOTBALL_KEY`.
  - `fetchLiveWorldCupData(): Promise<LiveFixture[]>` — if no key, returns `[]` and logs a single clean info message ("API key missing — using local fixture schedule"). If key present, fetches `/fixtures?live=all`, maps response to a normalized `LiveFixture` shape `{ teamA, teamB, status, liveScore, matchMinute }` keyed by team names.
  - `applyLiveFixturesToStore(fixtures)` helper that matches incoming fixtures to existing `MATCHES` by team-name pair and calls `useMatchStore.getState().applyLiveUpdate(...)`. Never overwrites kickoff time, city, broadcaster, or our schedule.

### 1.4 Developer-mode live simulation
- `src/store/app-store.ts`: add `devSimulateLive: boolean` + `setDevSimulateLive`.
- `src/routes/profil.tsx`: new card "Entwickler-Modus: Live-Daten simulieren" with a `Switch` bound to `devSimulateLive`. Short helper text explains it ticks fake scores for the match closest to now.
- New `useLiveSimulation` hook (mounted in root): when `devSimulateLive` is true, every ~8 s picks the match with `status === "live"` (or the closest upcoming one within the last 110 min window) and calls `applyLiveUpdate` to bump scores (`0:0 → 1:0 → 1:1 …`) and minute. When toggle is off, does nothing.

## Phase 2 — API-Football integration

### 2.1 Secure key handling
- Key is read only as `import.meta.env.VITE_API_FOOTBALL_KEY` inside `src/services/footballApi.ts`. No fallback hardcoded key. No backend secret needed (publishable client-side env var; usage of API-Football from the browser is the user's explicit ask — we'll note CORS/quotas in a code comment).
- In `src/routes/profil.tsx` (dev card only, gated by `import.meta.env.DEV`): show a small `Alert` explaining where to paste the key in Lovable's Environment Variables panel and the exact variable name `VITE_API_FOOTBALL_KEY`.

### 2.2 Live polling loop
- New `useLiveApi` hook mounted in root: when `devSimulateLive` is OFF **and** a key is present, polls `fetchLiveWorldCupData()` every 30 s and pipes results through `applyLiveFixturesToStore`. When key missing or simulation on, the hook is a no-op.
- Strictly maps by `teamA + teamB` names against `MATCHES`; ignores fixtures it can't match. Never edits our scheduled kickoff dates, cities, or broadcasters.

### 2.3 Tabellen auto-recalc
- `src/routes/tabellen.tsx` already subscribes to `useMatchStore` via `selectMatchList` and recomputes through `calculateTableStandings` on render. Confirm wiring is intact after refactor; standings will animate via existing framer-motion `layout` props when API updates push new `liveScore` values into the store.

## Technical details

- New files: `src/services/footballApi.ts`, `src/hooks/useLiveClock.ts`, `src/hooks/useLiveSimulation.ts`, `src/hooks/useLiveApi.ts`.
- Edited files: `src/store/match-store.ts`, `src/store/app-store.ts`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/profil.tsx`, `src/lib/categorize.ts` (drop `now` param coupling if needed).
- Removed: `tickClock` usage from UI (kept in store as internal helper for the simulation hook).
- Type-check after changes; verify dashboard rolls forward without manual interaction and the dev-toggle drives live score changes in preview.

## Open question

API-Football's browser CORS support is limited — most setups proxy through a server. Do you want me to (a) call it directly from the browser using the publishable `VITE_` env var (simple, may hit CORS), or (b) route requests through a TanStack `createServerFn` using a server-only `API_FOOTBALL_KEY` secret (more secure, no CORS issues)? Plan above assumes (a) per your wording; say the word and I'll switch to (b).