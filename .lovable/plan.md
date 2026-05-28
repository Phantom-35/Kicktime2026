# System Audit — FIFA WM 2026

## Audit results (read-only checks)

### 1. Static data & live API
- `src/data/world_cup_2026_schedule.json` contains 104 matches, 72 of stage `group`. IDs `m-001`…`m-072` are **complete, no gaps, no duplicates**.
- Field naming differs from your spec but is internally consistent:
  - `teamA / teamB` (not `homeTeam / awayTeam`)
  - `utcTimestamp` (not `utcDateTime`)
  - `broadcasters` array (not `tv`)
  - `hostCountry` (not `country`)
  - All required values are present on every match.
- Live API path is intact: `services/footballApi.ts` → Supabase Edge Function `fetch-live-scores` → `normalize()` → `applyLiveFixturesToStore()` merges by team-code pair into `match-store`. Edge function currently returns `{fixtures: []}` (off-season), so no live data — merge code is reachable and idempotent.

### 2. Timezone / ISO-8601
- All 72 `utcTimestamp` values match `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$` and parse via `new Date()`.
- `src/lib/time.ts` already delegates to `Intl.DateTimeFormat` (browser TZ + DST). No hardcoded `+1/+2` offsets remain anywhere in `src/`.
- `userTimezone` still exists in `app-store` and is passed into `getLocalParts(utc, tz)` but the function **ignores** the arg (documented). It's harmless legacy — I'll note it but not rip it out unless you want.
- `spiele.tsx` groups by `parts.dayKey` (local YYYY-MM-DD), so a 23:59Z kickoff appears on the next day in CEST. Confirmed by inspection.

### 3. TV broadcasting
- **MagentaTV present on all 72 group matches.**
- Free-TV: opener `m-001` MEX–RSA → `[MagentaTV, ARD]`. GER games → `m-010` `[MagentaTV, ARD]`, `m-033` `[MagentaTV, ARD, ZDF]`, `m-056` `[MagentaTV, ARD]`. `MatchCard` / `MatchDetailSheet` render the array joined with `&`, so both logos appear side-by-side. ✔

### 4. Missing piece — automated dev validator
There is no in-app self-test. I'll add one.

## Plan (single change)

Add `src/lib/scheduleAudit.ts` with `runScheduleAudit()`:
- Loops all 72 group matches
- Asserts: id pattern `m-0\d\d`, ISO-8601 Z, `new Date()` valid, required fields non-empty, `MagentaTV` in `broadcasters`, free-TV rule for `m-001/010/033/056`
- Simulates a mock live payload (`{m-001: {a:1,b:0,status:'live',minute:42}}`), calls `applyLiveUpdate`, reads back from store, asserts merge worked, then `resetMatches()` to roll back
- Console output: green `✅ SUCCESS: 72/72 matches valid` or red `❌ ERROR …` per failure, grouped

Wire it in `src/routes/__root.tsx` behind `if (import.meta.env.DEV)` inside a `useEffect` so it runs once on app load in dev only — zero impact on production bundle behavior.

No data file changes, no removals — current data and logic pass all four audit areas; the only delta is the new validator + one-line dev hook.

## Summary answers
1. Static ↔ live merge: **working** (by team-code pair, not match id — that's the existing design since the API doesn't expose FIFA match numbers).
2. Timezone/date grouping: **flawless** — native Intl, DST-correct, local-day grouping.
3. Refactors applied during audit: **none required**; the only new code is the optional dev validator described above.
