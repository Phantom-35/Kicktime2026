# Änderungen

## 1. Scroll-To-Top Button (Spiele-Tab)
- In `src/routes/spiele.tsx`: kleiner runder Button unten rechts (`fixed bottom-20 right-4`, über BottomNav), zeigt einen Pfeil nach oben (`ChevronUp`).
- Erscheint nur, wenn `window.scrollY > 400` (via `useEffect` + scroll-Listener, state `showTop`).
- Klick → `window.scrollTo({ top: 0, behavior: "smooth" })`.

## 2. App-Versionsanzeige (Profil-Tab)
- Version aus `package.json` ist nicht direkt importierbar — stattdessen in `vite.config.ts` `define: { __APP_VERSION__: JSON.stringify(pkg.version) }` einfügen und Typdeklaration in `src/vite-env.d.ts` ergänzen.
- In `src/routes/profil.tsx` ganz unten, unter dem bestehenden Footer-Text:
  `KickTime 2026 · v{__APP_VERSION__}` in `text-[10px] text-muted-foreground`.

## 3. „Alle Daten löschen" (Profil-Tab)
- Neue Card am Ende vor dem Footer, Titel „Daten zurücksetzen", roter Destructive-Button „Alle Daten löschen".
- Klick öffnet `AlertDialog` (shadcn) mit Bestätigung.
- Bei Bestätigung:
  - `localStorage.removeItem("kicktime-2026")` (Zustand-Persist-Key).
  - Alle weiteren App-Keys löschen (falls vorhanden, z. B. Match-Store falls persistiert).
  - `useAppStore.persist.clearStorage()` zusätzlich.
  - `toast.success("Alle Daten gelöscht — du kannst die App neu starten.")`.
  - `window.location.reload()` nach ~800 ms, damit Onboarding wieder erscheint.

## 4. Kalender-Eintrag (iOS/Android funktionsfähig)
- Neue Util `src/lib/calendar.ts` mit `addMatchToCalendar(match)`:
  - Generiert eine `.ics`-Datei (VCALENDAR/VEVENT) mit:
    - `DTSTART`/`DTEND` (90 Min Spiel + 15 Min Vorlauf) in UTC (`YYYYMMDDTHHMMSSZ`).
    - `SUMMARY` = „🏆 {TeamA} vs {TeamB} (Gruppe X)".
    - `LOCATION` = „{Stadium}, {City}".
    - `DESCRIPTION` = Sender + Hinweis.
    - `UID` = match-id.
  - Erstellt Blob `text/calendar`, triggert Download über versteckten `<a download="match-...ics">`-Klick.
  - iOS Safari / Android Chrome öffnen `.ics` automatisch im System-Kalender.
- Ersetzt den bisherigen Toast-Only-Handler im Dashboard-„Zum Kalender hinzufügen"-Button (`src/routes/index.tsx`).

## 5. Wetter-Info entfernen (Match-Detail)
- In `src/components/match/MatchDetailSheet.tsx`: das Insight-Element „Wetter" entfernen. Grid bleibt 2-spaltig, „Stadion" rückt nach oben links, „Anreise & Transit" bleibt voll-breit.
- `Cloud`-Icon-Import entfernen.
- `weatherForecast` im Type `Match` bleibt erhalten (kein Refactor der Daten nötig).

## 6. Push-Benachrichtigungen zuverlässig (iOS/Android)
- Web-Push auf iOS funktioniert **nur als installierte PWA** (ab iOS 16.4). Plan:
  - Service Worker `public/sw.js` registrieren (Notification-Click-Handler).
  - `public/manifest.webmanifest` ergänzen mit `display: "standalone"`, Icons, Name, Theme-Color.
  - `<link rel="manifest">` im `__root.tsx` einbinden.
  - In `src/routes/profil.tsx` beim Aktivieren des Switches:
    1. `Notification.requestPermission()`.
    2. Bei `denied` → Toast mit Anleitung (in den Browser-/iOS-Einstellungen erlauben).
    3. Bei iOS-Browser **außerhalb** der Home-Screen-Installation → Hinweis-Toast: „Auf iPhone: ‚Zum Home-Bildschirm hinzufügen', danach Push aktivieren".
    4. Service Worker registrieren falls noch nicht.
  - Lokale Benachrichtigungen (für die 15-Min-Wecker) via `setTimeout` + `registration.showNotification(...)` solange Tab/PWA offen — echtes Server-Push (VAPID) wäre Backend-Arbeit und liegt außerhalb dieses Scopes; das wird im Hinweistext transparent gemacht.

## 7. Spoiler-Schutz zuverlässig
- Aktueller Stand: nur `MissedStream` (Dashboard) respektiert `spoilerProtection`.
- Fix:
  - `MatchCard` (`hideScore`-Prop): bereits vorhanden → in `spiele.tsx` und `index.tsx` (alle Streams mit `finished`-Spielen) `hideScore={spoiler && match.status === "finished"}` setzen.
  - `MatchDetailSheet`: falls `match.status === "finished"` und `spoilerProtection` aktiv → Score wird im Sheet ausgeblendet (blur + „Ergebnis aufdecken"-Button lokal im Sheet).
  - Live-Spiele werden NICHT vom Spoiler-Schutz versteckt (User schaut bewusst zu).

# Technische Details

- Keine neuen Dependencies nötig (ICS-Generation und Service Worker handgeschrieben).
- `AlertDialog` ist bereits via Radix installiert.
- Memory-Update: keine.
- Kein DB/API-Touch.

# Geänderte/neue Dateien

- neu: `src/lib/calendar.ts`
- neu: `public/sw.js`
- neu: `public/manifest.webmanifest`
- bearbeitet: `src/routes/spiele.tsx` (Scroll-Top + Spoiler)
- bearbeitet: `src/routes/profil.tsx` (Version, Reset, Push-Flow)
- bearbeitet: `src/routes/index.tsx` (Kalender-Handler + Spoiler in allen Streams)
- bearbeitet: `src/components/match/MatchDetailSheet.tsx` (Wetter raus, Spoiler im Sheet)
- bearbeitet: `src/routes/__root.tsx` (Manifest-Link, SW-Registrierung)
- bearbeitet: `vite.config.ts` (`__APP_VERSION__` define)
- bearbeitet: `src/vite-env.d.ts` (Typ für `__APP_VERSION__`)
