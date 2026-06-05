
## Tournament Countdown Widget (v4.0.0)

Add an elegant, dismissible countdown widget directly under the header on the dashboard. Fully local, ticking every second, and aware of the tournament phase + the user's favorites.

### 1. Store changes — `src/store/app-store.ts`
- Add persisted state:
  - `showCountdown: boolean` (default `true`)
  - `setShowCountdown(v: boolean)` action
- Bump `APP_VERSION` to `"4.0.0"`.

### 2. New component — `src/components/dashboard/TournamentCountdown.tsx`
Self-contained widget. Reads from `useMatchStore(selectMatchList)`, `useAppStore` (`favoriteTeams`, `showCountdown`, `setShowCountdown`).

**Tick logic**
- Local `now` state initialized to `Date.now()`.
- `useEffect` starts `setInterval(() => setNow(Date.now()), 1000)`; returns `clearInterval` cleanup. Single interval, no leaks.

**Target selection (memoized on `now`, matches, favorites)**
- Tournament start = kickoff of earliest match in schedule (computed via `Math.min` over `utcTimestamp`).
- If `now < tournamentStart` → mode `"pre"`, target = tournament start, label = `🏆 Das größte Turnier der Welt startet in`.
- Else → mode `"in"`:
  - Find next `scheduled`/`live` match where `favoriteTeams` includes `teamA` or `teamB` (sorted by kickoff). If found → label = `🔥 Dein nächstes Top-Match: {A} vs. {B} in`.
  - Otherwise → next upcoming match of the day (today's `dayKey` per `getLocalParts`) → label = `⏱️ Nächstes Spiel heute: {A} vs. {B} in`.
  - If no more matches today and no favorite match → render nothing (return `null`).

**Countdown math**
- `diff = max(0, target - now)`; derive days/hours/minutes/seconds.
- When `diff === 0` and mode `"pre"`, swap to `"in"` automatically on next tick (re-derives from memo).

**Markup & styling (Stadium Night, semantic tokens only)**
- Root: `relative rounded-2xl border border-primary/25 bg-card/60 backdrop-blur-md px-4 py-3 shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.35)]`.
- Subtle inner gradient overlay using existing tokens (no raw hex).
- Label row: small uppercase muted text with the contextual sentence.
- Time row: 4 segments (Tage · Std · Min · Sek), each value in `font-mono tabular-nums text-2xl font-bold tracking-tight`, unit label below in `text-[10px] uppercase text-muted-foreground`. Fixed widths via `min-w-[2.5ch] text-center` so the layout never jumps on second ticks.
- Dismiss button: top-right, `absolute top-2 right-2 h-6 w-6 rounded-full bg-background/40 hover:bg-background/70`, `X` icon (`lucide-react`), `aria-label="Countdown ausblenden"`, calls `setShowCountdown(false)`.
- Wrap in `motion.div` with subtle fade/scale entry; wrap in `AnimatePresence` at the call site for graceful exit when dismissed.

### 3. Integration — `src/routes/index.tsx`
- Import `TournamentCountdown`.
- Read `showCountdown` from `useAppStore`.
- Render at the very top of the dashboard container (before the "Dein WM-Tag" heading) inside `AnimatePresence`, conditional on `showCountdown`.

### 4. Settings toggle — `src/routes/profil.tsx`
- Add a new switch row (in the "Anzeige" / display section, near spoiler protection) titled `Turnier-Countdown anzeigen` with a short description (`Blendet das Countdown-Widget oben auf dem Dashboard ein.`), bound to `showCountdown` / `setShowCountdown`.
- Update `APP_VERSION` constant to `"4.0.0"`.

### 5. Performance & cleanup
- Exactly one `setInterval(…, 1000)` per mounted widget, cleared in the effect's cleanup.
- Heavy computations (tournament start, next match lookup) wrapped in `useMemo` keyed on `matches`, `favoriteTeams`, and `now` (only the seconds-truncated value where appropriate to avoid needless re-renders).
- No external libraries added.

### Files
- **Created**: `src/components/dashboard/TournamentCountdown.tsx`
- **Edited**: `src/store/app-store.ts`, `src/routes/index.tsx`, `src/routes/profil.tsx`
