## 1. Timezone step layout (`src/components/onboarding/OnboardingFlow.tsx`)

Restructure Step 1 so the content is a single compact vertical stack inside one card — no `flex-1`, no `justify-between`, no spacer divs between the dropdown and the "Weiter" button.

Order inside the card:
1. Icon
2. Title "Wähle deine Zeitzone"
3. Description
4. Timezone Select dropdown
5. "Weiter" button (full-width, directly beneath the dropdown, `mt-4`)

Remove any `min-h-screen` / `flex-col justify-between` pattern on this step. The step container becomes a top-aligned `space-y-4` block under the progress bar. Apply the same compact pattern to Step 0/3 only if needed for visual consistency; otherwise leave them.

## 2. Remove fake scores / finished matches (`src/data/matches.ts`)

- Set every match's `status` to `"scheduled"`.
- Delete all `score` fields.
- Drop the artificial `NOW = 2026-06-20` reference assumption from sample data (the constant in `src/lib/categorize.ts` stays — it's the engine's "now" anchor; we'll re-anchor it to pre-tournament, e.g. `2026-06-10T12:00:00Z`, so all new matches register as upcoming and the "Missed" bucket is naturally empty until simulation).
- `MatchCard` already hides the score when `status !== "finished"`, so no UI change needed.

## 3. Real WM 2026 teams (`src/data/teams.ts`)

Replace `TEAMS` with the 48 officially-listed nations in the 12-group layout below. Italy, Egypt-as-D, etc. are removed/relocated. Tier assignment: keep tier 1 for traditional top nations (GER, FRA, ESP, ENG, POR, ARG, BRA, NED, BEL), tier 2 for solid contenders (CRO, URU, COL, MEX, USA, SUI, JPN, MAR, SEN, AUT, SWE, NOR), tier 3 for the rest. Flags via emoji; new codes added where missing (RSA, BIH, HAI, CUW, COD, CPV, IRQ, JOR, ALG).

Groups:
- A: MEX, RSA, KOR, CZE
- B: CAN, BIH, QAT, SUI
- C: BRA, MAR, HAI, SCO
- D: USA, PAR, AUS, TUR
- E: GER, CUW, CIV, ECU
- F: NED, JPN, SWE, TUN
- G: BEL, EGY, IRN, NZL
- H: ESP, CPV, KSA, URU
- I: FRA, SEN, IRQ, NOR
- J: ARG, ALG, AUT, JOR
- K: POR, COD, UZB, COL
- L: ENG, CRO, GHA, PAN

Update `PRIORITY_CODES` order (unchanged set: GER, ITA→remove, ARG, BRA, FRA, ESP, ENG, POR, NED, CRO, BEL, SUI, AUT, USA). New list: GER, ARG, BRA, FRA, ESP, ENG, POR, NED, CRO, BEL, SUI, AUT, USA, MEX. Drop ITA.

`getTeam` and `getSortedTeams` helpers stay as-is.

## 4. Real sample matches (`src/data/matches.ts`)

Replace `MATCHES` with the 10 marquee fixtures below, all `status: "scheduled"`, no `score`. UTC timestamps spread across morning / afternoon / deep-night Europe/Berlin to exercise the time-window engine.

| # | Match | Group | Stadium / City | UTC | DE local | Broadcaster |
|---|---|---|---|---|---|---|
| 1 | MEX – RSA (Opening) | A | Estadio Azteca, Mexiko-Stadt | 2026-06-11T23:00:00Z | 01:00 | ARD |
| 2 | USA – PAR | D | SoFi Stadium, Los Angeles | 2026-06-13T20:00:00Z | 22:00 | MagentaTV |
| 3 | BRA – MAR | C | Hard Rock Stadium, Miami | 2026-06-14T19:00:00Z | 21:00 | ZDF |
| 4 | GER – CUW | E | MetLife Stadium, New York | 2026-06-14T22:00:00Z | 00:00 | ARD |
| 5 | NED – JPN | F | BMO Field, Toronto | 2026-06-14T16:00:00Z | 18:00 | MagentaTV |
| 6 | ESP – CPV | H | AT&T Stadium, Dallas | 2026-06-15T18:00:00Z | 20:00 | ARD |
| 7 | FRA – SEN | I | Mercedes-Benz Stadium, Atlanta | 2026-06-16T13:00:00Z | 15:00 | ZDF |
| 8 | ENG – CRO | L | Gillette Stadium, Boston | 2026-06-17T18:00:00Z | 20:00 | MagentaTV |
| 9 | POR – COD | K | Levi's Stadium, San Francisco | 2026-06-17T03:00:00Z | 05:00 | ARD |
| 10 | ARG – ALG | J | Arrowhead Stadium, Kansas City | 2026-06-17T22:00:00Z | 00:00 | ZDF |

Each match keeps the existing `Match` shape (travel distances, weather forecast as plausible strings).

## 5. Standings (`src/data/groups.ts`)

Reset all `MOCK_STATS` to zero (pre-tournament). Simplest: change `MOCK_STATS` to `{}` so every team renders 0/0/0/0 0:0 0pts in standings. Keeps the standings UI working without showing fake results.

## 6. Categorizer anchor (`src/lib/categorize.ts`)

Move `NOW` to `2026-06-10T12:00:00Z` so all sample matches are upcoming, missed bucket is empty, and "Perfect / Nachtschicht" buckets correctly populate from the new schedule.

## Files touched
- `src/components/onboarding/OnboardingFlow.tsx` (Step 1 only)
- `src/data/teams.ts`
- `src/data/matches.ts`
- `src/data/groups.ts`
- `src/lib/categorize.ts`

No store, no routing, no UI-token changes.
