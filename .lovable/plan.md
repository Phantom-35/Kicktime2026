
## Endgame-Feature (v7.11.0)

Wenn das Finalspiel (`stage === "final"`, `status === "finished"`, mit Score) offiziell entschieden ist, wird der Sieger automatisch ermittelt und app-weit gefeiert. Kein WhatsNew-Eintrag.

### 1. Zentraler Hook: `useTournamentWinner`

Neuer Hook `src/hooks/useTournamentWinner.ts`:
- Liest aus dem `useMatchStore` das Match mit `stage === "final"`.
- Gibt `null` zurück, solange das Finale nicht `finished` ist oder kein Score vorhanden ist oder es ein Unentschieden ohne Tiebreaker-Info ist.
- Sonst: liefert `{ teamCode, team }` — Sieger = Team mit höherem Score (via `REAL_TEAMS` Lookup aus `src/data/teams.ts`, um Name + Flag zu bekommen). Placeholder-Codes werden ignoriert (via `isPlaceholderTeam`).

### 2. Winner-Overlay (einmalig)

Neue Komponente `src/components/endgame/WinnerCelebrationOverlay.tsx`:
- Bildschirmfüllendes `fixed inset-0`-Overlay mit dunklem Backdrop, framer-motion Fade/Scale-In.
- Konfetti-Regen: leichtgewichtige CSS/Framer-Motion-Lösung (~40 goldene/rote/blaue Partikel, absolute positioning, `animate` von `y: -20` bis `y: 100vh` mit zufälligem `delay` und `rotate`). Keine neue Dependency.
- Inhalt (zentriert):
  - Großes goldenes Pokal-Icon (`Trophy` aus `lucide-react`, `text-yellow-400`, drop-shadow-glow).
  - Riesige Flagge des Siegers.
  - Headline: „🏆 {LAND} IST WELTMEISTER 2026!" gefolgt von „Herzlichen Glückwunsch!"
  - Kleinerer Danktext: „Danke, dass du KickTime 2026 für deine WM-Planung und Turnier-Begleitung genutzt hast! ❤️"
  - „Schließen"-Button.
- Persistenz: `localStorage`-Key `kicktime.endgame.celebrated.v1` = Sieger-Code. Wird beim Schließen (Button, Backdrop-Klick oder ESC) gesetzt und das Overlay danach nie wieder gezeigt (auch nicht auf anderen Geräten separat — pro Browser einmal).
- Rendert nur, wenn `winner` existiert UND localStorage noch nicht gesetzt ist.

### 3. Hall-of-Fame-Banner (permanent, ersetzt Countdown)

Neue Komponente `src/components/dashboard/HallOfFameBanner.tsx`:
- Kartengröße wie `TournamentCountdown`.
- Goldschimmerndes Design: `bg-gradient-to-br from-yellow-500/20 via-amber-400/10 to-yellow-600/20`, `border-yellow-400/40`, subtiler animierter Shine (framer-motion `backgroundPosition` Loop).
- Inhalt:
  - Zeile 1 (bold, groß): „👑 Weltmeister 2026: {Flag} {Land}"
  - Zeile 2 (klein, muted): „Danke für die Nutzung von KickTime!"

### 4. Integration in Dashboard (`src/routes/index.tsx`)

- `useTournamentWinner()` aufrufen.
- Wenn `winner`: Rendere `<HallOfFameBanner winner={winner} />` **anstelle** von `<TournamentCountdown />`.
- Unabhängig davon (aber ebenfalls nur wenn `winner`): Rendere `<WinnerCelebrationOverlay winner={winner} />` — die Komponente entscheidet intern via localStorage, ob sie sich zeigt.

### 5. Version

- `src/lib/version.ts` → `7.11.0`.
- **Kein** WhatsNew-Update (explizit vom User gewünscht).

### Technische Details

- Sieger-Ermittlung bevorzugt `score` (final), fällt auf `liveScore` zurück wenn `score` fehlt aber Status `finished`.
- Bei Unentschieden ohne Tiebreaker-Daten: kein Sieger, Countdown/aktueller Zustand bleibt aktiv (das Endergebnis inkl. Elfmeter kommt via Admin-Override oder API und wird dann korrekt erkannt, sobald ein Team mehr Tore hat).
- Konfetti läuft ~6s, dann Fade-Out der Partikel; das restliche Overlay bleibt bis der User schließt.
- `Trophy`-Icon nutzt bestehendes `lucide-react` — keine neuen Packages.
