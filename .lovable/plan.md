## v7.10.0 — Rundenlabels, größere Close-Hitbox, automatische Bracket-Resolution

### 1) Turnier-Runden auf Match Cards (Spiele-Tab)

`src/components/match/MatchCard.tsx`: KO-Badge zeigt statt generisch „KO-Runde" den echten Runden-Namen an. Mapping via zentraler Helper-Funktion in `src/lib/match-phase.ts`:

```
r32   → "Sechzehntelfinale"
r16   → "Achtelfinale"
qf    → "Viertelfinale"
sf    → "Halbfinale"
third → "Spiel um Platz 3"
final → "Finale"
```

Neuer Helper `getStageLabel(stage)` — dient auch als Mapping für API-Kürzel („1/16", „1/8", „QF" etc.), falls die API sie liefert. Kein API-seitiges Renaming nötig, weil `match.stage` bereits der kanonische Wert ist. Badge bleibt visuell (accent, uppercase, tracking-wider) — nur Text ändert sich. Long-Labels bleiben durch das kompakte Layout lesbar.

### 2) Vergrößerte Close-Hitbox im Team-Detail-Sheet (Status-Tab)

Der Close-Button wird vom `SheetContent` in shadcn automatisch gerendert (fix positioniert `top-4 right-4` mit 16×16 Icon). Für Touch-Bedienung zu klein.

Änderung in `src/components/team/TeamDetailSheet.tsx`:
- `SheetContent` bekommt `className="… [&>button]:h-12 [&>button]:w-12 [&>button]:rounded-full [&>button]:flex [&>button]:items-center [&>button]:justify-center"` – das trifft den automatisch injizierten Close-Button und pusht seine klickbare Fläche auf 48×48 px, ohne das Icon selbst zu vergrößern (das X-Icon in shadcn ist absolut, bleibt bei 4×4).
- Alternative konsequenter: Wir überschreiben in derselben Datei mit einem Tailwind-Attribute-Selector `[&>button.absolute]` und setzen `p-3` + `-m-2` (visueller Reset, größere Hitbox). Ergebnis identisch, Icon bleibt elegant klein zentriert.

Kein globaler Eingriff in `src/components/ui/sheet.tsx` — nur lokal auf das Team-Sheet, damit andere Sheets ihre bestehende Optik behalten.

### 3) Automatische Bracket-Resolution über Folge-API-Routen

Ziel: Sobald z. B. das Sechzehntelfinale beendet ist, sollen die R16-Platzhalter (`W:m-073|m-074` etc.) automatisch durch die echten Teams aus der API-Route `/5` ersetzt werden — analog für QF (`/6`), SF (`/7`), Third (`/8`), Final (`/9`).

**Erkennungslogik für Platzhalter** (neue Helper in `src/lib/ko-phase.ts`):
```ts
isPlaceholderTeam(code) → true, wenn der Code KEIN echter Team-Code aus REAL_TEAMS ist
                                 (typische Muster: "W:…", "L:…", "1A", "2B", "3C-D-E-F")
```

**Neuer Poller-Modus in `useLiveApi.ts`**:
Nach jedem erfolgreichen Live-Fetch der aktuell aktiven Phase prüfen wir für die *nächste* KO-Phase, ob deren API-Route bereits echte Teams liefert. Wenn ja → Fetch dieser Route (Cache: 5 min, gleiche Edge Function mit `koPhase`-Parameter) und via `applyLiveFixturesToStore` einspielen. Da die Route `matchId`s liefert und wir sekundär auf `matchId` matchen, werden die Slots im lokalen Store überschrieben, sobald ein Match dort gepaart werden kann.

**Neuer Store-Fluss** (`src/store/match-store.ts`):
- Erweiterung von `applyApiUpdate` um optionale Team-Codes: Wenn der aktuelle Match einen Placeholder-Team-Code trägt und die API einen echten Code liefert, wird `teamA`/`teamB` überschrieben. Bei bereits echten Teams greift der Guard und schützt vor versehentlichem Überschreiben.
- Der bestehende `finishMatchFromApi` bleibt unverändert.

**Erweiterung `applyLiveFixturesToStore`** (`src/services/footballApi.ts`):
- Beim Match via `matchId` wird zusätzlich `teamA`/`teamB` mitgegeben (`upgradePlaceholders: true`), sodass R16-Slots mit „W:m-073|m-074" durch die echten Nationalcodes ersetzt werden.

**Erweiterung `determineActiveKoPhase`**:
- Zusätzlich Rückgabe einer optionalen „next phase to prefetch" (z. B. wenn R32 fertig ist, während R16 als aktive Phase läuft, prefetchen wir /6 nur einmal pro 30 min, um Platzhalter für QF vorzubereiten).
- Konkret: Neuer Export `getNextPhaseForBracketPrefetch(matches, activePhase)` — liefert die nächste Phase, deren Slots aktuell noch Platzhalter enthalten.

**Anpassung Edge Function `supabase/functions/fetch-live-scores/index.ts`**:
- Kein Schema-Change. Der bestehende `koPhase`-Parameter wird weiterhin genutzt; für Prefetch nutzen wir dieselbe Route mit einem separaten Cache-Key (bereits via `wm26-ko-X` gegeben). Ergebnisse landen ebenfalls in `match_results`, aber nur wenn Team-Namen vorhanden sind — Placeholder-Slots werden nicht in die DB persistiert (Guard in `persistFixtures`).

### Dateiübersicht

- `src/lib/match-phase.ts` — neuer Export `getStageLabel(stage)`.
- `src/components/match/MatchCard.tsx` — Badge nutzt `getStageLabel`.
- `src/components/team/TeamDetailSheet.tsx` — `SheetContent` bekommt Hitbox-Klassen für den Close-Button.
- `src/lib/ko-phase.ts` — `isPlaceholderTeam`, `getNextPhaseForBracketPrefetch`.
- `src/services/footballApi.ts` — `applyLiveFixturesToStore` upgraded Platzhalter-Team-Codes.
- `src/store/match-store.ts` — `applyApiUpdate` erlaubt Team-Code-Upgrade nur bei Placeholder-Ausgangszustand.
- `src/hooks/useLiveApi.ts` — nach Haupt-Fetch zusätzlicher Prefetch der nächsten Phase.
- `src/components/whats-new/WhatsNewModal.tsx` + `src/lib/version.ts` — v7.10.0 Eintrag.

### Keine SQL-/Supabase-Änderungen nötig

Die bestehenden Tabellen (`match_results`, `match_overrides`, `live_fixtures_cache`) reichen. Edge Function wird nicht neu deployt, da wir am Contract nichts ändern.
