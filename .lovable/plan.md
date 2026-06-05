
# KickTime 2026 — Version 5.0.0

Vier neue Features plus ein "Was ist neu"-Onboarding nach dem Update. Alles minimalistisch, lokal, ohne neue Abhängigkeiten (außer einer kleinen Util für Image-Export, siehe unten).

---

## 1. Tipp-Spiel (eigener Tab "Tipps")

### Store (`src/store/app-store.ts`)
- Neuer State `predictions: Record<string, { a: number; b: number; createdAt: number }>` (persistiert).
- Actions: `setPrediction(matchId, a, b)`, `clearPrediction(matchId)`.

### Eingabe im MatchDetailSheet
- Neue Sektion "Dein Tipp" — sichtbar nur solange `match.status === "scheduled"`.
- Zwei kompakte Number-Stepper (− / Zahl / +) für Team A und Team B, dazwischen ":".
- Speichern automatisch on change → `setPrediction`. Toast: "Tipp gespeichert ⚽" + leichte Vibration (siehe Punkt 4).
- Falls schon ein Tipp existiert: vorausgefüllt, plus "Tipp löschen"-Link.
- Nach Abpfiff (`finished`): zeigt Tipp vs. Endstand mit Badge "Volltreffer" / "Tendenz" / "Daneben" (siehe Scoring).

### Scoring-Logik (`src/lib/predictions.ts`, neu)
- `scorePrediction(pred, score)` → `"exact" | "diff" | "tendency" | "miss"`.
  - exact: gleiches Ergebnis → 3 Punkte
  - diff: gleiche Tordifferenz (≠0) → 2 Punkte
  - tendency: gleicher Sieger / beides Remis aber falsches Resultat → 1 Punkt
  - miss: 0 Punkte
- `summarize(predictions, matches)` → `{ total, exact, diff, tendency, miss, points, hitRate }`.

### Neuer Tab "Tipps" (`src/routes/tipps.tsx`)
- Route: `/tipps`, Icon `Trophy` aus lucide.
- Header-Stat-Card: große Punktzahl, daneben Trefferquote (% bewertete Tipps mit ≥1 Punkt).
- Donut/Bar minimalistisch in reinen Tailwind-Divs (4 Segmente).
- Zwei Listen-Sektionen:
  - **Offen** — Spiele mit Tipp, noch nicht gespielt. Klick → öffnet MatchDetailSheet.
  - **Bewertet** — schon gespielte Spiele mit Tipp, sortiert neueste zuerst, mit Tipp-zu-Endstand-Vergleich und Punkten.
- Empty-State: "Noch keine Tipps. Tippe in der Spiel-Detailansicht."

### Bottom-Nav (`src/components/layout/BottomNav.tsx`) + SideNav
- Tabs auf **6** erweitern: Dashboard · Spiele · Tabellen · **Tipps** · Gastro · Profil.
- `grid-cols-5` → `grid-cols-6`, Icon `Trophy`.

### routeTree
- TanStack-Plugin generiert automatisch bei Dev-Start neu, sobald `src/routes/tipps.tsx` existiert.

---

## 2. Share-Card Generator

### `src/lib/share-card.ts` (neu)
- `generateShareCard(match): Promise<Blob>` baut eine 1080×1350-PNG via `OffscreenCanvas` (Fallback `<canvas>`).
- Inhalte: Stadium-Night-Gradient, KickTime-Wortmarke oben, beide Flaggen-Emojis riesig, Teamnamen, Datum/Uhrzeit lokal, Stadion + Stadt, Score (wenn finished) oder Kickoff-Zeit. Akzentfarbe = aktive `--primary` (via `getComputedStyle`).
- Reine Canvas-API, **keine neue Dependency** (kein html2canvas), damit das Cloudflare-Worker-Bundle sauber bleibt und auch im Browser problemlos läuft.

### Trigger im MatchDetailSheet
- Neuer Button "Als Bild teilen" (Icon `Share2`) unter der Broadcaster-Sektion.
- Logik:
  1. `const blob = await generateShareCard(match)`
  2. Wenn `navigator.canShare?.({ files: [file] })` → `navigator.share({ files: [file], title, text })`.
  3. Sonst → Download via `<a download="kicktime-{id}.png">`.
- Toast-Feedback + Haptic-Tick.

---

## 3. Homescreen-Shortcuts (Punkt 13)

Echte Mehrfach-Shortcuts über das Web-App-Manifest — beim langen Drücken des PWA-Icons (Android/Chromium) erscheinen die Menüpunkte direkt.

### `public/manifest.webmanifest`
- `shortcuts`-Array hinzufügen:
  - **Heute** → `/` (Icon: Pitch-Green Square mit "⚽")
  - **Tipps** → `/tipps` (Trophy)
  - **Tabellen** → `/tabellen` (Liste)
  - **Gastro in der Nähe** → `/bars` (Pin)
- Vier kleine 96×96-PNG-Icons unter `public/shortcuts/` (mit imagegen erzeugt).
- Falls noch nicht im `<head>`: `<link rel="manifest" href="/manifest.webmanifest">` in `src/routes/__root.tsx` ergänzen.
- **Kein** Service Worker, kein `vite-plugin-pwa` — nur Manifest-Shortcuts (entspricht der PWA-Skill-Regel "Manifest-only Home-Screen Support").

---

## 4. Haptic Feedback (Punkt 15)

### `src/lib/haptics.ts` (neu)
- Wrapper um `navigator.vibrate(pattern)` mit Feature-Detection.
- Presets: `tap()` = 8 ms, `success()` = [10, 30, 10], `warn()` = [20, 40, 20].
- No-op auf nicht unterstützten Geräten (iOS Safari → still). Kein Toast, keine Errors.

### Auslöser
- **Glocke** (`AlarmBell`) on activate → `success()`, on deactivate → `tap()`.
- **Favoriten-Cycle** im Profil-Tab → `tap()`.
- **Tipp gespeichert** → `tap()`.
- **Share-Card erzeugt** → `tap()`.
- **Spoiler aufdecken** → `tap()`.
- **Toast bei Toren** der Live-Simulation bleibt unverändert; kein Vibration-Spam.

---

## 5. "Was ist neu"-Modal nach dem Update

### Store
- `lastSeenVersion: string` (persistiert, default `""`).
- Beim App-Start (in `__root.tsx`-Effekt) wird verglichen: ist `lastSeenVersion !== APP_VERSION` UND `isOnboarded === true` → `showWhatsNew = true` (lokales React-State im Root-Layout).

### Komponente `src/components/whats-new/WhatsNewModal.tsx` (neu)
- shadcn-`Dialog` (rounded-2xl, Stadium-Night-Look).
- Inhalt für v5:
  - **Tipp dein Turnier** — Eigener Tipps-Tab mit Statistik.
  - **Teile dein Match** — Schickes Share-Bild aus jedem Spiel.
  - **Homescreen-Shortcuts** — Lange aufs App-Icon drücken.
  - **Fühl dich rein** — Sanfte Vibrationen bei wichtigen Aktionen.
- Ein einziger Button "Los geht's" → schreibt `setLastSeenVersion("5.0.0")` und schließt.

### Onboarding-First-Use-Schutz
- Neue Nutzer (`isOnboarded === false`) sehen das Modal **nicht** — beim Abschluss des Onboardings wird `lastSeenVersion` sofort auf die aktuelle Version gesetzt, damit das Modal erst nach dem nächsten Update auftaucht.

---

## 6. Version & Polish
- `APP_VERSION` in `src/routes/profil.tsx` → `"5.0.0"`.
- Profil-Footer-Versionsanzeige bleibt automatisch korrekt.
- Onboarding-Flow ergänzt: am Ende `setLastSeenVersion("5.0.0")`.

---

## Validierung
- Manuelle Smoke-Tests in der Preview:
  - Tipps-Tab erreichbar, Stepper speichert, Statistik aktualisiert sich nach finished match.
  - Share-Button erzeugt downloadbare PNG.
  - Manifest validiert in Chrome DevTools → Application → Manifest (Shortcuts sichtbar).
  - Vibration via DevTools-Device-Toolbar / Android-Test (auf Desktop no-op, keine Fehler in Console).
  - WhatsNew-Modal: nach `localStorage.removeItem("kicktime-2026")` + Onboarding-Skip via gesetztem `isOnboarded:true, lastSeenVersion:"4.0.0"` prüfen, dass es genau einmal kommt.
- `npm/bun run build` (vom Harness automatisch ausgeführt) muss grün sein — keine neuen Dependencies, keine Worker-inkompatiblen Imports.

## Geänderte / neue Dateien
- **Neu**: `src/routes/tipps.tsx`, `src/lib/predictions.ts`, `src/lib/share-card.ts`, `src/lib/haptics.ts`, `src/components/whats-new/WhatsNewModal.tsx`, `public/shortcuts/{today,tipps,tables,bars}.png`.
- **Edit**: `src/store/app-store.ts`, `src/components/match/MatchDetailSheet.tsx`, `src/components/match/AlarmBell.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/SideNav.tsx`, `src/routes/__root.tsx`, `src/routes/profil.tsx`, `src/components/onboarding/OnboardingFlow.tsx`, `public/manifest.webmanifest` (oder neu, falls nicht vorhanden).
