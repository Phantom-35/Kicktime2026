
# Supabase-backed live data refactor

Goal: remove all direct `api-football.com` calls from the frontend and route them through a Supabase Edge Function. The frontend will only ever talk to Supabase, which is what the future iOS build needs.

Note on architecture: this project runs on TanStack Start, which normally prefers `createServerFn` for server work. For an iOS app that talks directly to Supabase (no TanStack server in front of it), an Edge Function is the right call — it lives next to the data the mobile client will already be using. We accept that tradeoff intentionally.

## 1. Supabase client

- Add dependency: `@supabase/supabase-js`.
- Create `src/integrations/supabase/client.ts`:
  - Reads `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
  - Exports a single `supabase` browser client with `auth.persistSession` enabled (ready for later iOS auth work).
  - Throws a clear console error if either env var is missing so we catch config issues early.

## 2. Edge Function: `fetch-live-scores`

Create `supabase/functions/fetch-live-scores/index.ts`:

- Standard Deno `serve(...)` handler.
- CORS preflight (OPTIONS) + permissive `Access-Control-Allow-Origin: *` headers (locked down later when we know the iOS origin).
- Reads `Deno.env.get("API_FOOTBALL_KEY")`. If missing → 500 with a clear message.
- Calls `GET https://v3.football.api-sports.io/fixtures?live=all` with `x-apisports-key`.
- Normalizes the response into the same `LiveFixture[]` shape we already use:
  ```ts
  { teamA, teamB, status, liveScore?, matchMinute? }
  ```
  (team-code mapping stays in the frontend, since that's where our `TEAMS` catalogue lives — the function just forwards the cleaned JSON.)
- Returns `{ fixtures: ApiFootballFixture[] }` so the frontend can keep its existing `normalize()` logic.

Manual step for you (I'll prompt for this during build):
1. Supabase Dashboard → Project → **Edge Functions → Secrets** → add `API_FOOTBALL_KEY = <your key>`.
2. The function is auto-deployed by Lovable Cloud once committed under `supabase/functions/`.

## 3. Frontend rewire

`src/services/footballApi.ts`:
- Delete the direct `fetch("https://v3.football.api-sports.io/...")` call and the `VITE_API_FOOTBALL_KEY` reference.
- Replace `fetchLiveWorldCupData()` with:
  ```ts
  const { data, error } = await supabase.functions.invoke('fetch-live-scores')
  ```
- Keep the existing `normalize()` + `applyLiveFixturesToStore()` pipeline so the match store contract doesn't change.
- `hasApiKey()` becomes `isLiveDataEnabled()` — true whenever Supabase is configured. The presence of the API key now lives on the server, so the frontend just assumes the function is wired and gracefully falls back if `invoke` returns an error.

`src/hooks/useLiveApi.ts`:
- No structural change. It still polls every 30s, still no-ops when `devSimulateLive` is on. Just calls the new service.

`src/routes/profil.tsx`:
- Remove the dev-only `VITE_API_FOOTBALL_KEY` instructions card.
- Replace with a short card pointing to Supabase: "Live-Daten laufen über die Edge Function `fetch-live-scores`. API-Schlüssel wird in Supabase → Edge Functions → Secrets als `API_FOOTBALL_KEY` hinterlegt."
- The developer simulator toggle stays exactly as-is.

## 4. Tabellen / recalculation

No changes needed. `tabellen.tsx` already subscribes to `useMatchStore` via `selectMatchList` and recomputes `calculateTableStandings` on every render. Once the Edge Function pushes new `liveScore` values through `applyLiveFixturesToStore`, points and goal difference update automatically.

## What I'll need from you (during build)

1. Confirm the Supabase integration is in fact connected (so `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are injected). I'll verify by checking the env at build time.
2. Your `API_FOOTBALL_KEY` — but you set this directly in the Supabase dashboard, never in chat. I'll show you exactly where.

## Files

- New: `src/integrations/supabase/client.ts`, `supabase/functions/fetch-live-scores/index.ts`
- Edited: `src/services/footballApi.ts`, `src/routes/profil.tsx`
- Untouched: `src/store/match-store.ts`, `src/hooks/useLiveClock.ts`, `src/hooks/useLiveSimulation.ts`, `src/hooks/useLiveApi.ts`, `src/routes/tabellen.tsx`
- Removed reference: `VITE_API_FOOTBALL_KEY` (no longer used anywhere)
