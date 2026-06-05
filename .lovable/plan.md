# KickTime 2026 — Version 5.1

Drei chirurgische Anpassungen an den v5.0-Features. Keine neuen Dateien, keine neuen Dependencies.

---

## 1. Tipp-Sektion: manuelles Speichern

**Datei:** `src/components/match/MatchDetailSheet.tsx` → `PredictionSection`

- Auto-Save in `step()` entfernen — Stepper updaten nur noch lokales `valA`/`valB`.
- Neuer „dirty"-Zustand: `const dirty = valA !== (pred?.a ?? 0) || valB !== (pred?.b ?? 0)`.
- Unter den beiden Steppern (vor dem finished-Block) ein zentrierter, kompakter Button:
  - Label: **„Tipp speichern"**
  - Style: `mx-auto mt-3 h-8 px-4 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 disabled:opacity-40` (Stadium-Night-Look).
  - `disabled` wenn `finished` oder `!dirty`.
  - onClick: `setPrediction(match.id, valA, valB)` → `haptics.tap()` → `toast.success("Tipp gespeichert ⚽")`.
- Hinweistext „Tipp wird automatisch gespeichert." entfernen.
- „Tipp löschen" bleibt unverändert (kein Toast-Vibration-Spam, aber `haptics.tap()`-Aufruf dort entfernen — siehe Punkt 2).

## 2. Vibrationen exakt auf 3 Aktionen begrenzen

Behalten:
- `src/components/match/AlarmBell.tsx` (Z. 28 + 32: `haptics.tap()` / `haptics.success()`).
- `src/components/match/MatchDetailSheet.tsx` neuer „Tipp speichern"-Button (Punkt 1).
- **Neu hinzufügen:** `haptics.tap()` im `onClick` jedes „Zum Kalender hinzufügen"-Buttons in `src/routes/index.tsx`, `src/routes/spiele.tsx`, `src/routes/tabellen.tsx` (jeweils direkt vor/nach `addMatchToCalendar(match)`).

Entfernen:
- `src/components/match/MatchDetailSheet.tsx` Z. 271 (`persist` in alter Step-Logik fällt mit Punkt 1 ohnehin weg), Z. 301 (Tipp löschen), Z. 404 (ShareCardButton).
- `src/routes/profil.tsx` Z. 233 (Favoriten-Cycle).
- Import-Check: `haptics` in `profil.tsx` und ggf. nicht mehr genutzten Stellen entfernen, falls keine Verwendung mehr.

## 3. „Was ist neu"-Modal-Texte

**Datei:** `src/components/whats-new/WhatsNewModal.tsx`

- Eintrag „Homescreen-Shortcuts":
  - Titel → **„Schneller am Ball"**
  - Text → „Optimierte Ladezeiten und direkter Zugriff über dein Homescreen-Icon."
- Eintrag „Fühl dich rein":
  - Titel → **„Spürbares Feedback"**
  - Text → „Sanfte Vibrationen bei Top-Aktionen (auf unterstützten Android-Geräten)."

## 4. Version

- `src/lib/version.ts`: `APP_VERSION = "5.1.0"`.
- Folge: `WhatsNewModal` triggert beim nächsten Start einmalig für bestehende Nutzer (lastSeenVersion war "5.0.0").

---

## Validierung
- Stepper ändert Zahl ohne Toast/Vibration; Button erscheint aktiv erst nach Änderung; nach Klick: Toast + Vibration + Button wieder disabled.
- AlarmBell, Kalender-Button und Tipp-Speichern triggern Vibration; Share-Card, Favoriten-Cycle, Spoiler etc. nicht mehr.
- Modal zeigt neue Texte und v5.1.
- Build grün (keine ungenutzten Imports).
