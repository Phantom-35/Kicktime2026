# Update v7.4.0 — Plan

## 1. Perfect Matches in der KO-Phase reparieren
**Problem:** `categorizeMatches` filtert auf `involvesAny` (Top-/interesting-Team). In KO-Spielen mit Platzhalter-Codes (z.B. `W49`, `RU-A`) matchen keine Favoriten → leere Liste.

**Fix in `src/lib/categorize.ts`:**
- In der KO-Phase (`stage !== "group"`) gilt jedes anstehende Spiel automatisch als „relevant".
- Logik: `const involvesAny = m.stage === "group" ? (involvesFav || involvesInt) : true;`
- `isMarquee`/Nachtschicht-Logik bleibt unverändert; in KO landet jedes Spiel im `perfect`-Bucket sofern es im Zeitfenster liegt, sonst in `nightShift` (Marquee-Bedingung greift dort ohnehin via tier-Check oder wir lockern sie für KO).
- Zusätzlich: KO-Spiele ohne Zeitfenster-Treffer kommen ebenfalls in `nightShift` (statt rauszufallen).

## 2. „KO-Runde"-Badge auffällig
**`src/components/match/MatchCard.tsx`** (Zeile 51-54): bedingt rendern
- `match.stage === "group"` → bestehendes neutrales Badge „Gruppe X"
- sonst → auffälliges Badge: `bg-accent text-accent-foreground border border-accent ring-1 ring-accent/40 shadow-sm` mit Text **„KO-Runde"** (Uppercase, tracking-wider).

**`src/components/match/MatchDetailSheet.tsx`** (Zeile 112): Untertitel anpassen
- group → `… · Gruppe {match.group}`
- KO → `… · ` gefolgt von prominentem Inline-Badge **„KO-Runde"** in Akzentfarbe.

## 3. Erweiterte Admin-Telemetrie
**`src/components/admin/AdminPanel.tsx` (TelemetryView):**
- Berechnung erweitern:
  - `activeNow` (5 min) — bestehend
  - `active24h` — Pings innerhalb 24 h
  - `active7d` — Pings innerhalb 7 Tagen
- Metrik-Grid auf 4 Kacheln (`grid-cols-2` zweireihig): 5 min / 24 h / 7 d / Geräte gesamt.

**Geräte-Duplizierung:** `getClientId()` in `src/lib/telemetry.ts` speichert die UUID bereits permanent in `localStorage` unter `kicktime-client-id` (siehe Zeile 26-37) → bereits korrekt umgesetzt; keine Änderung nötig. Wird im Plan dokumentiert/verifiziert.

## 4. Gastro-Tab ausblenden (Code bleibt)
**`src/components/layout/BottomNav.tsx`:**
- Eintrag `{ to: "/bars", label: "Gastro", icon: MapPin }` aus dem aktiven `tabs`-Array entfernen, aber als auskommentierten Block direkt darüber stehen lassen (mit Hinweis „später reaktivierbar").
- Grid von `grid-cols-6` auf `grid-cols-5` ändern → verbleibende 5 Tabs verteilen sich gleichmäßig.
- `src/components/layout/SideNav.tsx` analog prüfen und Gastro-Eintrag dort ebenfalls auskommentieren (Route + Datei bleiben unangetastet).

## 5. Code-Bereinigung & Bug-Hunting
Gezielt (kein Risiko-Refactor), nur sicher tote Stellen:
- `src/routes/index.tsx`: `EmptyHint`-Komponente wird definiert aber nie sinnvoll genutzt (returnt `null`) → entfernen samt Aufrufstelle.
- `MissedStream`: unbenutzter Import `AlarmBell` checken; nicht referenzierte Hilfsvariablen entfernen.
- Doppelter Live-Badge-Code in `MatchDetailSheet` (Pulse-Dot wurde in v7.3 in MatchCard entfernt, hier noch vorhanden) → Pulse-Animation auch hier entfernen für Konsistenz mit „Jetzt im TV"-Wording (`Live · …` → `Läuft · …`, kein animate-ping).
- Schneller Scan auf ungenutzte Exports/Imports in `src/lib/*` und ggf. ungenutzte alten Hilfs-Helpers (z. B. `isPerfectFor`/`isNightShift` falls nirgends referenziert) — nur entfernen, wenn nachweislich keine Imports existieren.
- Gastro-Code (`src/routes/bars.tsx`, `src/data/publicViewingData.ts`) bleibt unverändert.

## 6. WhatsNewModal v7.4.0
**`src/components/whats-new/WhatsNewModal.tsx`** komplett ersetzen durch 3 Einträge (keine Admin-Erwähnung):
1. 🏆 **Willkommen in der KO-Runde!** — heiße Phase, KO-Spiele am neuen hervorgehobenen Design erkennbar.
2. ⭐ **Perfect Matches Update** — zuverlässige Anzeige aller KO-Highlights.
3. ✨ **Aufgeräumtes Interface** — schlankere Navigation, Performance optimiert.

Icons: `Trophy`, `Sparkles`, `LayoutGrid` (oder vorhandene Lucide-Icons).

## 7. Versionierung
- `src/lib/version.ts` → `7.4.0`
- `package.json` `version` → `7.4.0`

## Technische Details
- Keine DB-Migration nötig (Telemetrie nutzt bestehende `app_pings.last_ping`-Spalte).
- Keine neuen Secrets, keine Edge-Function-Änderungen.
- Pure Frontend-Änderungen + Telemetrie-Aggregation client-seitig im AdminPanel.

## Keine manuellen Schritte erforderlich.
