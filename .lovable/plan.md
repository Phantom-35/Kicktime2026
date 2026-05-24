## 1. Live-ready match store (foundation for everything else)

Create `src/store/match-store.ts` (Zustand) as the single source of truth for match runtime state. Seeds from `MATCHES` once, then exposes:

- `matches: Record<string, RuntimeMatch>` where `RuntimeMatch` extends `Match` with `status: "scheduled" | "live" | "finished"`, `liveScore?: {a:number;b:number}`, `matchMinute?: number`.
- `now: number` — a "current time" cursor that drives the rolling dashboard. Initialized to the existing demo `NOW` (`2026-06-10T12:00:00Z`) so the current Perfect/Night/Missed split keeps working.
- Actions designed to map 1:1 to a future sports-API payload:
  - `applyLiveUpdate(id, { liveScore, matchMinute, status })`
  - `finishMatch(id, finalScore)`
  - `tickClock(ms)` — advances `now`, auto-transitions matches whose kickoff has passed to `"live"`, and matches whose kickoff+110min has passed to `"finished"` (using `liveScore` as final if present).
  - `replaceAll(payload)` — drop-in for a future real API fetch.

Refactor `src/lib/categorize.ts` to take `matches` and `now` as parameters instead of importing `MATCHES` and the hardcoded `NOW`. `src/lib/standings.ts` already accepts matches + live scores, so it stays — but `tabellen.tsx` switches from local `useState` live scores to the shared store so live status is consistent across tabs.

## 2. Rolling dashboard with "Nachrücken"

`src/routes/index.tsx`:

- Subscribe to `useMatchStore`. Pass `matches` and `now` into `categorizeMatches`.
- Add a small dev/demo clock control (a single hidden-by-default "⏭ Zeit vorspulen 2h" button at the bottom of the page) that calls `tickClock` so the rolling behavior is visible without waiting for real time. In production this is replaced by `setInterval(() => tickClock(60_000), 60_000)` plus the real API feed.
- Both `Stream` lists already use `AnimatePresence` per item. Add `layout` to each `motion.div` and an `exit={{ opacity: 0, y: -8, scale: 0.97 }}` so finished matches slide out of Perfect/Night and the next ones rise from below. The Missed list gets the same treatment for incoming entries (`initial={{ y: 8 }}`).
- No category cap — the master schedule flows continuously. As matches finish they leave Perfect/Night and appear at the top of Missed.

## 3. Match card metadata polish

`src/components/match/MatchCard.tsx`: replace the top-right timestamp with a pill:

```tsx
<span className="text-sm font-semibold tabular-nums text-foreground bg-muted/60 border border-border/60 rounded-full px-2.5 py-1">
  {local.fullStr}
</span>
```

For matches that are currently `"live"`, swap the pill for a red pulsing variant showing `{matchMinute}'` and the live score next to (or replacing) the central VS block.

## 4. Profile: Theme + Notifications

Extend `src/store/app-store.ts` with `theme: "dark" | "light"` (default `"dark"`) and `pushEnabled: boolean` (default `false`), plus setters. Persist them with the existing `kicktime-2026` key.

Add a small `ThemeProvider` effect in `src/routes/__root.tsx` that toggles the `dark` class on `document.documentElement` based on `theme`.

`src/styles.css`: add `:root.light { … }` overrides — off-white background (`oklch(0.985 0.003 250)`), dark slate foreground, lighter card/muted/border tokens, keep the pitch-green primary. The existing `@custom-variant dark (&:is(.dark *))` plus the new `.light` class on `<html>` give us a clean switch without touching components.

`src/routes/profil.tsx`: add two new Cards above the destructive reset button:

- **Design-Modus** — segmented toggle (Dark / Hell) using a `Switch` with `Moon`/`Sun` icons.
- **Push-Benachrichtigungen** — `Switch` bound to `pushEnabled`; on enable, call `Notification.requestPermission()` (best-effort, swallow errors) and `toast.success("Push aktiviert")`.

## Files

- new: `src/store/match-store.ts`
- edit: `src/lib/categorize.ts` (accept matches+now as params)
- edit: `src/routes/index.tsx` (use match store, rolling list, demo clock control)
- edit: `src/components/match/MatchCard.tsx` (timestamp pill + live state)
- edit: `src/routes/tabellen.tsx` (use shared live state from match store)
- edit: `src/store/app-store.ts` (theme + pushEnabled)
- edit: `src/routes/__root.tsx` (apply theme class)
- edit: `src/styles.css` (`.light` token set)
- edit: `src/routes/profil.tsx` (two new toggle cards)

## Out of scope

No real network calls — the store just exposes the API shape so a future feed can drop in. No changes to onboarding, bars, or match detail sheet.
