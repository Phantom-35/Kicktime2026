## Ziel
Im Turnier-Status-Tab (`/turnier`) werden die Länderkarten anklickbar. Ein Klick öffnet ein Bottom-Sheet mit Team-Header, Basis-Fakten und nach Positionen gruppiertem Kader. Optik passt zum Dark/Neon-Design. Bestehende Logik im Turnier-Status-Tab bleibt unangetastet.

## 1. Kader-Daten integrieren
- Upload `wm2026_kader.json` als App-Daten unter `src/data/wm2026_kader.json` ablegen (statisches JSON, ~5.4k Zeilen — nur bei Bedarf importiert).
- Neues Modul `src/data/squads.ts`:
  - Baut beim ersten Zugriff eine `Map<Code, TeamSquad>` per `apiNameToCode()` aus `src/utils/teamMapping.ts`, damit deutsche Ländernamen aus dem JSON auf unsere 3-Letter-Codes gemappt werden.
  - Export: `getTeamSquad(code: string): TeamSquad | null`.
  - `TeamSquad`-Typ: `{ trainer, verbandGegruendet, wmTitel, fifaWeltranglistenplatz, kontinentalverband, kader: { Torwart: Player[]; Abwehr: Player[]; Mittelfeld: Player[]; Sturm: Player[] } }`.
  - Import des JSON per **dynamischem Import** in `getTeamSquad`, damit das JSON erst beim ersten Öffnen eines Sheets in den Bundle-Chunk geladen wird (Lazy Loading, kein Overhead beim Rendern der Länder-Liste).

## 2. Neue Komponente `TeamDetailSheet`
Datei: `src/components/team/TeamDetailSheet.tsx`.
- Nutzt shadcn `Sheet` von unten (`side="bottom"`) mit abgerundeten oberen Kanten, `bg-card/95 backdrop-blur`, Neon-Akzent-Border (`border-primary/30`), max. Höhe `85vh`, scrollbar.
- Props: `open`, `onOpenChange`, `team: Team`, `alive`, `eliminatedIn?`.
- Header:
  - Große Flagge (Emoji, `text-6xl`), Team-Name als `h2`, Statusbadge (grün „Noch im Rennen" oder rot „Ausgeschieden – <Runde>").
  - Zwei prominente Badges/Chips: 🏆 „X WM-Titel" und 📊 „FIFA #<Platz>" mit Neon-Border/Glow.
- Basis-Info-Grid (2 Spalten, kompakte Kacheln):
  - Trainer, Kontinentalverband, Verband gegründet, Kadergröße.
  - Kachel-Stil: `rounded-xl border border-border bg-background/60 p-3`, kleiner Label + größerer Wert.
- Kader-Sektion:
  - `Tabs` (shadcn) mit den 4 Positionen: `Torwart · Abwehr · Mittelfeld · Sturm`. Tab-Label enthält Zähler in Klammern.
  - Pro Tab: `ul` mit einer Zeile pro Spieler (nummeriert), kompakte Karten `rounded-lg bg-background/40 border border-border/50 px-3 py-2`.
  - Falls Positionsgruppe leer → dezenter Hinweis.
- Fallback: Falls `getTeamSquad(code)` `null` liefert (unwahrscheinlich, aber defensiv), zeige nur Header + Basis-Info-Grid ohne Kader und Text „Kader-Infos nicht verfügbar".

## 3. Turnier-Seite anpassen
Datei: `src/routes/turnier.tsx`.
- Lokaler State `const [selected, setSelected] = useState<TeamStatus | null>(null)`.
- Beide `<li>`-Blöcke (alive + eliminated) werden zu `<button>`-Wrappern (semantisch `<li><button …>`), rufen `setSelected({team, alive, eliminatedIn})`.
- Visuell: unverändertes Styling + `hover:border-primary/50 active:scale-[0.98] transition` und `cursor-pointer`.
- Am Seitenende `<TeamDetailSheet open={!!selected} onOpenChange={(v)=>!v && setSelected(null)} …>`.
- Import der Sheet-Komponente per **lazy** (`React.lazy` + `<Suspense fallback={null}>`), damit die JSON-Kader-Daten wirklich erst on-click geladen werden.

## 4. WhatsNew-Modal aktualisieren
Datei: `src/components/whats-new/WhatsNewModal.tsx`
- Neuer `FEATURES`-Array-Inhalt für v7.8 mit einem Eintrag zum klickbaren Turnier-Status inkl. Kader-Ansicht (Icon `Users` aus `lucide-react`).
- Rest des Modals unverändert.

Datei: `src/lib/version.ts`
- `APP_VERSION = "7.8.0"`.

## 5. Nicht anfassen
- Bestehende Turnier-Status-Berechnung (`src/lib/tournament-status.ts`) und Live-Daten-/DB-Logik aus v7.7.
- Match-Store, Edge Functions, Telemetrie.

## Technische Details
- **Lazy Load**: `wm2026_kader.json` wird nur via `await import("@/data/wm2026_kader.json")` innerhalb `getTeamSquad` geladen. Die Map wird nach erstem Load gecached (`let indexCache: Map | null`).
- **Mapping-Sicherheit**: Wenn ein Ländername im JSON von `apiNameToCode` nicht erkannt wird → Console-Warning, Team überspringen. Alle 48 WM-Teams sind in `TEAM_MAPPINGS` bereits enthalten inkl. deutscher Namen.
- **Keine neuen Abhängigkeiten**; `Sheet`, `Tabs`, `Badge` sind über shadcn bereits verfügbar (bei Bedarf via bestehendes Muster in `src/components/ui/`).

## Betroffene Dateien
- neu: `src/data/wm2026_kader.json` (Upload)
- neu: `src/data/squads.ts`
- neu: `src/components/team/TeamDetailSheet.tsx`
- edit: `src/routes/turnier.tsx`
- edit: `src/components/whats-new/WhatsNewModal.tsx`
- edit: `src/lib/version.ts`
