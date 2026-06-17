# Update v7.0.0 — Live-Fokus, Smart-Scroll & Top-Spiele

Alle bestehenden Funktionen bleiben unverändert. Nur Ergänzungen.

## 1) Kompakte "Jetzt live"-Sektion

**Neue Komponente:** `src/components/match/LiveNowBar.tsx`
- Liest `useMatchStore(selectMatchList)` und filtert auf `status === "live"`.
- Rendert nichts, wenn 0 Live-Spiele laufen (auto-hide).
- Eine schmale Zeile mit pulsierendem roten Dot, Text "Jetzt live · N Spiel(e)" und kompakter Teamliste (Flaggen + Score).
- Props: `onOpenMatch(match)` und `onOpenList(matches)`.
- Klick-Logik:
  - 1 Spiel → ruft `onOpenMatch(theMatch)` auf → öffnet `MatchDetailSheet`.
  - ≥2 Spiele → öffnet kompakten internen Sheet/Dialog mit Liste; Klick auf Eintrag → `onOpenMatch(match)`.

**Einbau:**
- `src/routes/index.tsx`: direkt über dem `Tabs`-Block, unter dem Countdown.
- `src/routes/spiele.tsx`: ganz oben über dem Suchfeld.
- Beide Routes verwalten den bereits vorhandenen `selected`-State für das DetailSheet.

**Roter Rahmen für Live-Karten:**
- `src/components/match/MatchCard.tsx`: Wenn `match.status === "live"`, ergänze die Outer-`className` um `border-destructive ring-2 ring-destructive/40` (statt nur `border-border`). Restliches Styling unberührt.

## 2) Auto-Scroll im Spiele-Tab

**`src/routes/spiele.tsx`:**
- Neuer `useEffect` beim Mount: Findet die erste Tagesgruppe, deren `dayKey >= heutigem dayKey`, sucht das DOM-Element per `data-day-key={key}` und ruft `el.scrollIntoView({ behavior: "smooth", block: "start" })`.
- Wrapper-`<div>` jeder Tagesgruppe bekommt das `data-day-key`-Attribut und `scroll-mt-20` (für sticky Header).
- Läuft nur wenn `q === ""` (nicht in Suche reinscrollen).

## 3) Vierte Filter-Pille "Besondere Spiele"

**`src/routes/index.tsx`:**
- `TabsList` von `grid-cols-3` auf `grid-cols-4`; neuer `TabsTrigger value="special"` mit Label "⭐ Top".
- Neuer `TabsContent value="special"` mit Section "Besondere Spiele · K.o. & Deutschland".
- Berechnung:
  ```ts
  const special = phaseMatches.filter(m =>
    m.teamA === "DEU" || m.teamB === "DEU" ||
    (m.stage !== "group" && m.stage !== "round32")  // Achtel & später
  ).sort(byTime);
  ```
  Stage-Werte werden vorher mit dem tatsächlichen Schema aus `src/data/matches.ts` abgeglichen (Achtel = `round16`/`r16`).
- Verwendet `Stream` mit Footer = `AlarmRow` analog zu "Nacht".

## 4) WhatsNewModal v7.0.0

**`src/components/whats-new/WhatsNewModal.tsx`:** Drei neue Features mit Icons (`Radio`, `ArrowUpToLine`, `Star` aus lucide-react):
- "🔴 Live-Fokus" — Live-Sektion + roter Rahmen.
- "⬆️ Smart-Scroll im Spielplan" — Auto-Scroll zum aktuellen Tag.
- "⭐ Top-Spiele Filter" — vierte Pille.

**Version-Bumps:**
- `src/lib/version.ts` → `"7.0.0"`
- `package.json` → `7.0.0`

## Technische Details / Stage-Werte

Vor Implementierung: `src/data/matches.ts` lesen, um exakten `MatchStage`-Typ zu kennen (z. B. `"group" | "round32" | "round16" | "quarter" | "semi" | "final"`). Filter in (3) entsprechend anpassen, sodass "ab Achtelfinale" korrekt heißt: alles außer `group` und ggf. `round32`.

## Was du manuell tun musst

**Nichts.** Keine SQL-Migrationen, keine Edge-Function-Deploys, keine Secrets, keine Permission-Änderungen. Reines Frontend-Update — wird mit dem nächsten Reload aktiv und das Whats-New-Modal poppt automatisch dank Versions-Bump.
