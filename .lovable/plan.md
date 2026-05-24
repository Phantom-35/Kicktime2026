## Onboarding & Team Selection Refactor

Rebuild the onboarding flow into a 4-step experience with a new welcome splash, a redesigned two-section team picker, and a full 48-team database with smart sorting. Dark theme and dashboard logic remain untouched.

### 1. Data — expand to 48 teams (`src/data/teams.ts`)

- Add all 48 qualified FIFA 2026 nations with name, code, flag emoji, group (A–L), and a new `priority` field.
- Introduce `PRIORITY_CODES` array (in display order): GER, ITA, ARG, BRA, FRA, ESP, ENG, POR, NED, CRO, BEL, SUI, AUT, USA.
- Export helper `getSortedTeams()` → priority tier first (in declared order), then remaining teams alphabetically by German name.
- Keep existing `TEAMS` array and `getTeam()` signature so `categorize.ts`, `MatchCard`, `MatchDetailSheet`, `groups.ts`, etc. keep working. Existing matches reference team codes that already exist; no match data changes needed.

### 2. Store — explicit team-list semantics (`src/store/app-store.ts`)

- Replace `toggleTeam(code)` cycle with two explicit actions:
  - `toggleFavorite(code)` — adds to `favoriteTeams`; if present in `interestingTeams`, removes it there. Re-tap removes from favorites.
  - `toggleInteresting(code)` — mirror behavior for `interestingTeams`.
- Mutual exclusion guaranteed at the store layer, so the UI just calls the action.
- Update `Profil` page to use the new actions (simple star/bell tap, no cycle).

### 3. Onboarding flow — 4 steps (`src/components/onboarding/OnboardingFlow.tsx`)

Steps: `Welcome → Zeitzone → Teams → Zeitfenster`.

**Progress bar:** 4 segments at the top; current step is wide & primary, completed steps filled at 60%, upcoming are muted. Labels under bar: "Start · Zeitzone · Teams · Zeitfenster".

**Step 0 — Welcome splash (new):**
- Centered hero: animated icon (framer-motion) — `Clock` icon that rotates/morphs into a `Trophy`/football `CircleDot` using a layered transition.
- Title `KickTime 2026` in display weight; tagline: "Verpasse kein wichtiges WM-Spiel mehr trotz Zeitverschiebung. Dein persönlicher, spoilerfreier WM-Planer, angepasst an DEINEN Alltag."
- Three feature cards (vertical stack on mobile) with lucide icons + bold title + one-line copy:
  1. `Clock` — "Dein Zeitfenster" / "Spiele passend zu deiner Freizeit."
  2. `EyeOff` — "Spoiler-Schutz" / "Ergebnisse der Nacht bleiben verdeckt."
  3. `Tv` — "Direkt-Streams" / "Sofort sehen, ob ARD, ZDF oder MagentaTV überträgt."
- CTA button: "Jetzt einrichten 🚀" — primary, full-width, with subtle pulsing glow (`shadow-[0_0_30px_hsl(var(--primary)/0.5)]` + framer-motion scale tween). No Back button on step 0.

**Step 1 — Zeitzone:** unchanged behavior, restyled to match new visual rhythm.

**Step 2 — Teams (redesigned, no more multi-tap):**
- Two clearly separated blocks, each in a rounded card with header + subtitle, scrollable grid inside.
- Block A — "1. Deine absoluten Favoriten" with `Star` icon header. Subtitle as specified. Grid of team chips; selected = primary-green border, filled `Star` badge, subtle glow. Tap toggles favorite via `toggleFavorite()`.
- Block B — "2. Weitere interessante Teams" with `Bell` icon. Subtitle as specified. Selected = amber/yellow border, filled `Bell` badge. Tap toggles via `toggleInteresting()`.
- A team already chosen as Favorite renders in Block B greyed out with a tiny "⭐ Favorit" hint (still tappable to move it: tap promotes to Interesting and clears favorite — mutual exclusion handled in store). Same logic mirrored for the other direction.
- Each block uses `getSortedTeams()` so the 14 priority nations are at the top; remaining 34 below with a subtle divider labeled "Weitere Nationen".
- Team card: larger (h-20), shows flag (emoji rendered larger; if we have time, swap to SVG via a small `<span>` with `font-emoji`), full German name, and active icon badge in the top-right corner.

**Step 3 — Zeitfenster:** unchanged behavior, restyled.

**Navigation:**
- Footer with Back / Weiter buttons. Step 0 hides Back and shows the glowing CTA instead.
- `Weiter` disabled when:
  - Step 1: no timezone selected (always populated from detect, so effectively always enabled).
  - Step 2: no team picked at all in either list (forces at least one selection so dashboard isn't empty).
- Final step CTA: "WM-Planer starten ⚽" → `setOnboarded(true)`.

### 4. Profil page (`src/routes/profil.tsx`)

- Replace single-tap cycle with two side-by-side mini sections (or a compact toggle group per team) using the new `toggleFavorite` / `toggleInteresting` actions. Visually consistent with new onboarding (star vs bell).

### 5. Polish

- All transitions via existing framer-motion `AnimatePresence` (slide+fade between steps).
- Tokens only — primary green for favorites, accent (volt) repurposed or `--warning` token added in `src/styles.css` for the amber bell color if needed.
- No changes to routing, matches, categorization, bars, or dashboard.

### Files touched

- `src/data/teams.ts` (expand to 48 + sorter)
- `src/store/app-store.ts` (split actions)
- `src/components/onboarding/OnboardingFlow.tsx` (rebuild, add Welcome step)
- `src/routes/profil.tsx` (adapt to new actions)
- `src/styles.css` (add warning/amber token if not present)
