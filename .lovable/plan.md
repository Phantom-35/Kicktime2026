# KickTime 2026 — Implementation Plan

A mobile-first React app (TanStack Start) that helps German fans plan their FIFA World Cup 2026 viewing across North-American kickoff times. Pure frontend, hardcoded mock data, no APIs.

## 1. Design System

Update `src/styles.css` with a dark-by-default theme:
- `--background`: deep slate (oklch ~0.18)
- `--card`: slightly lighter slate
- `--primary`: pitch green (emerald 500-ish in oklch)
- `--accent`: neon volt yellow
- `--foreground`: near-white
- Border radius bumped for iOS feel; subtle shadows

Force `.dark` on `<html>` in `__root.tsx`. Wrap all routes in a centered mobile shell: `max-w-md mx-auto min-h-screen shadow-2xl` with a dark page background outside the shell for desktop.

Components live under `src/components/` (kebab folders: `layout/`, `dashboard/`, `match/`, `onboarding/`, `bars/`, `ui-bits/`). Use `lucide-react`, `sonner` for toasts, framer-motion for transitions, shadcn `Sheet`/`Switch`/`Slider`/`Tabs`/`Input`/`Button`/`Badge`.

## 2. State Management

Single Zustand store (`src/store/app-store.ts`) persisted to `localStorage`:
- `userTimezone`, `favoriteTeams[]`, `interestingTeams[]`
- `availability: { weekday: {start,end}, weekend: {start,end} }`
- `spoilerProtection: boolean`
- `isOnboarded: boolean`
- `alarms: Record<matchId, boolean>`
- Actions for each field + `resetOnboarding()`

Timezone auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## 3. Mock Data (`src/data/`)

- `teams.ts` — 16 teams across Groups A–L (flag emoji, name, group, tier)
- `matches.ts` — 12+ matches with id, teamA/B, group, stadium, city, hostCountry, utcTimestamp (mix of 13/18/22/02 UTC), broadcaster, status, score, travel distances, weather
- `bars.ts` — 4 German sports bars (name, city, address, hours, matchIds[])
- `groups.ts` — derived standings per group with helper to highlight involved teams

## 4. Core Logic (`src/lib/`)

- `time.ts` — convert UTC → user timezone, format local kickoff, check if a match fits inside a weekday/weekend availability window (handles cross-midnight ranges)
- `categorize.ts` — given matches + user state, returns `{ perfect, nightShift, missed }`
  - perfect: involves fav/interesting team AND in window AND not finished
  - nightShift: marquee/fav match outside window AND not finished
  - missed: fav/interesting match in the past

## 5. Routing (TanStack Start)

- `src/routes/__root.tsx` — dark html, mobile shell, fixed header (title + spoiler switch), bottom tab bar, `<Outlet/>`, sonner Toaster. Gate: if `!isOnboarded` render Onboarding instead of children.
- `src/routes/index.tsx` — Dashboard with 3 segmented sub-tabs
- `src/routes/spiele.tsx` — Full calendar
- `src/routes/bars.tsx` — Gastro-Finder
- `src/routes/profil.tsx` — Settings
- Match detail = Sheet component opened from any card (no separate route)

## 6. Screens

**Onboarding** (`components/onboarding/OnboardingFlow.tsx`): 3 linear steps with progress dots, framer-motion slide transitions.
- Step 1: detected timezone + Select to change
- Step 2: team grid; click cycles none → ⭐ favorite (green border) → 🔔 interesting (yellow border) → none
- Step 3: two dual-handle sliders (0–24h) for weekday + weekend, with cross-midnight support; CTA writes `isOnboarded=true`

**Dashboard**: shadcn Tabs (Perfect / Nachtschicht / Verpasst) with motion fade. Cards show flag pair, local kickoff, broadcaster pill, group badge. Night-shift cards include a "WM-Wecker stellen" Switch → triggers `toast.success("Wecker für ... gestellt!")`. Missed cards: if spoilerProtection, blur score with overlay button "Ergebnis aufdecken" (per-card local state); always show "▶️ Spoilerfreie Highlights ansehen".

**Alle Spiele**: search input filters by team name; grouped by date headings; small green dot / yellow moon indicators; tap → detail Sheet.

**Match Detail Sheet**: broadcaster block + big "Jetzt Live-Stream öffnen" button, stadium/weather/travel stats, mini group table with the two involved teams highlighted (`bg-primary/20`).

**Gastro-Finder**: bar cards with address, late-night hours, badge "Zeigt dein nächstes Perfect Match" filter toggle, "Tisch reservieren" → toast.

**Profil/Settings**: timezone select, availability sliders (live edit), spoiler switch (mirrors header), "Onboarding zurücksetzen" destructive button.

## 7. Header & Bottom Nav

- Header: sticky, h-14, title "KickTime 2026" left, Eye/EyeOff icon + Switch right ("Spoiler-Schutz")
- Bottom nav: fixed inside mobile shell, 4 `<Link>`s with lucide icons (Home, Calendar, MapPin, Settings), active state uses primary color + small top indicator

## 8. Polish

- framer-motion page transitions on Outlet
- Tactile button press scale (`active:scale-[0.98]`)
- All copy in German per spec
- Use only semantic Tailwind tokens (`bg-primary`, `text-accent`, etc.) — no raw colors in JSX

## 9. Dependencies to add

`zustand`, `framer-motion` (lucide-react, sonner, shadcn primitives, date utilities already available).

## 10. Out of scope

No backend, no real broadcaster links, no real push notifications (toast-only), no Lovable Cloud needed.

---

After approval I'll build it end-to-end and verify the preview renders cleanly on mobile viewport.