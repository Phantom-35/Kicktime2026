## 1. Tabellen-Tab: Sektion "Nächste Spiele dieser Gruppe"

Datei: `src/routes/tabellen.tsx`

- Neuer `useMemo`-Block unterhalb des bestehenden `standings`-Memos:
  - Quelle: `matches` (bereits vorhanden via `useMatchStore(selectMatchList)`).
  - `now` aus dem Store lesen (`useMatchStore((s) => s.now)`), damit der Filter live mit dem Clock-Tick aktualisiert. Fallback: `Date.now()` falls undefined.
  - Filter: `m.group === activeGroup && m.stage === "group" && (m.status === "live" || new Date(m.utcTimestamp).getTime() >= now)`.
  - Sortierung aufsteigend nach `utcTimestamp` (live zuerst, da deren Kickoff in der Vergangenheit liegt → zusätzlich Live-Matches an den Anfang sortieren).
  - `.slice(0, 2)` → maximal 2 Einträge.
- Neuer JSX-Block direkt nach `<GroupCard ... />`:
  - Überschrift "Nächste Spiele dieser Gruppe" (gleicher Stil wie restliche Section-Headlines im Tab).
  - Wenn Array leer → Infokarte (gerundete Card, `border-border bg-card p-4`, Text: „Die Gruppenphase für diese Gruppe ist beendet. Die Top 2 stehen in der K.-o.-Runde.").
  - Sonst: Liste der Matches gerendert mit der **bestehenden** `MatchCard` aus `src/components/match/MatchCard.tsx` (identisch zum Spiele-Tab, inkl. TV-Sender-Footer).
  - Für den "Zum Kalender hinzufügen"-Button: gleiche Integration wie im Spiele-Tab. Ich prüfe in `src/routes/spiele.tsx`, wie dort der Button an die Karte angefügt wird (entweder via `children`-Prop von `MatchCard` oder als Bottom-Sheet/Detail). Übernehme exakt dasselbe Pattern (vermutlich `MatchDetailSheet` per `onClick`, und der Kalender-Button lebt im Sheet — dann ist die Konsistenz automatisch gegeben, da `MatchCard` identisch verwendet wird).

## 2. Splash-Flash beim Öffnen beheben

Datei: `src/routes/__root.tsx`

Problem: `showSplash` startet als `false`, wird erst im `useEffect` nach dem ersten Render auf `true` gesetzt → für 1 Frame ist die App sichtbar.

Fix:
- Initial-State für `showSplash` und `appReady` per Lazy-Initializer aus `sessionStorage` ermitteln, mit SSR-Guard:
  ```ts
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem("splash_shown") !== "1"; }
    catch { return false; }
  });
  const [appReady, setAppReady] = useState(() => !showSplashInitial);
  ```
- Den bisherigen `useEffect`, der `showSplash`/`appReady` setzt, entfernen.
- Zusätzlich `motion.div`-Wrapper mit `initial={appReady ? false : { opacity: 0, y: 24 }}` lassen, damit kein Flash entsteht. Da SSR `showSplash=false` liefert, könnte der allererste Server-HTML-Frame trotzdem die App zeigen — daher den App-Container per inline-style auf `opacity: 0` rendern, solange `!appReady` UND `typeof window !== "undefined"` noch nicht hydratisiert ist. Praktischer Ansatz: motion `initial={false}` entfernen und stattdessen `initial={{ opacity: 0, y: 24 }}` setzen, damit der erste Client-Frame garantiert unsichtbar ist; bei `splash_shown==="1"` direkt `animate={{opacity:1,y:0}}` mit `duration: 0`.

## 3. Version-Bump

Datei: `src/routes/profil.tsx` — `APP_VERSION` von `"3.2.3"` auf `"3.3.0"`.

## Technische Details

- Keine Änderungen an `MatchCard`, `match-store`, oder `calendar.ts` notwendig.
- Live-Update funktioniert automatisch via `useLiveClock` → `tickClock` → `now` ändert sich → `useMemo` re-evaluiert.
- Kein neuer State, keine neuen Dependencies.
