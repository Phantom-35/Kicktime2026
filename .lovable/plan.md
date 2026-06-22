## Update v7.3.0 — Erwartungsmanagement & Admin-Phasen

### 1. Wording & Icons: „Jetzt im TV"

**`src/components/match/LiveNowBar.tsx`**
- Text „Jetzt live" → **„Jetzt im TV"** (Banner-Label und Dialog-Titel).
- `Radio`-Icon (Funkwellen) entfernen, durch `Tv`-Icon (lucide-react) ersetzen — sowohl im Banner als auch im Dialog-Header.
- Den pulsierenden roten Dot (`animate-ping`) entfernen, da er ebenfalls einen Echtzeit-Ticker suggeriert. Roter Rahmen + rote Akzentfarbe bleiben als visueller Live-Marker erhalten.

**`src/components/match/MatchCard.tsx`**
- In der roten Status-Pille: Text `Live · {phase}` → **`Läuft · {phase}`**.
- Den pulsierenden Mini-Dot in der Pille entfernen (passend zum neuen, ruhigeren Erwartungsbild). Die Pille bleibt rot umrandet/eingefärbt; der rote Karten-Rahmen + Ring bleiben unverändert.

Der Phasen-Text kommt weiterhin aus `getMatchPhaseLabel()` und ergibt automatisch `1. Halbzeit` / `Halbzeitpause` / `2. Halbzeit`.

### 2. Admin-Panel: Phasen-Auswahl statt Minuten-Input

**`src/components/admin/LiveOverridePanel.tsx`**
- Das `<input type="number">`-Feld „Min" entfernen.
- Stattdessen drei Pillen-Buttons (segmented control) anzeigen, nur sichtbar wenn `status === "live"`:
  - **1. Halbzeit** → speichert intern `minute = 1`
  - **Halbzeitpause** → speichert intern `minute = 45`
  - **2. Halbzeit** → speichert intern `minute = 46`
- Initialwert aus bestehender `match.matchMinute` ableiten (≥46 → „2. HZ", ==45 → „Pause", sonst „1. HZ").
- Bei `status === "scheduled"` oder `"finished"` werden die Pillen ausgeblendet; `minute` wird wie bisher als `null` bzw. nicht gesendet.

**Keine DB-Änderung nötig** — die Spalte `match_overrides.minute` bleibt erhalten. Die drei Sentinel-Werte (1/45/46) passen exakt in die bestehende Logik von `getMatchPhaseLabel()`, sodass die Frontend-Pille automatisch den korrekten Phasentext anzeigt. Keine Migration, kein manueller Eingriff durch dich nötig.

### 3. WhatsNewModal & Version

**`src/lib/version.ts`** + **`package.json`**: Version → `7.3.0`.

**`src/components/whats-new/WhatsNewModal.tsx`**: Neuer Eintrag oben:
- 📺 **„Jetzt im TV"** — Wir haben das Wording für laufende Spiele angepasst. Du siehst sofort auf einen Blick, was aktuell im Fernsehen läuft (statt einen Sekunden-Ticker zu erwarten).
- ⚙️ **Admin: Phasen-Auswahl** — Saubere Auswahl zwischen 1. Halbzeit, Halbzeitpause und 2. Halbzeit statt händischer Minuten-Eingabe.

### Manuelle Schritte
**Keine.** Keine DB-Migration, keine Supabase-Konfiguration, keine neuen Secrets. Reiner Frontend-/UI-Patch.
