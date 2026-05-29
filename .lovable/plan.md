# Plan: KickTime 2026 – 10 Optimierungen

## 1. Teamliste auf echte WM-Teilnehmer reduzieren

Aktuell sind in `src/data/teams.ts` mehrere Nationen aufgeführt, die laut hochgeladenem FIFA-Spielplan (v17) **nicht** dabei sind. Im PDF tauchen u. a. diese Mannschaften auf, die in unserem Code fehlen oder falsch zugeordnet sind: **CRC (Costa Rica), CUR (Curaçao)** etc. Gleichzeitig sind im Code Teams, die im Spielplan nirgendwo erscheinen.

**Aktion:**
- `src/data/teams.ts` exakt an die Teams aus dem PDF angleichen (nur die `<mark>`-Codes ABC bis L4 aus dem Schedule).
- Codes, Gruppen, Flaggen und `TEAM_ISO2` synchronisieren.
- `src/utils/teamMapping.ts` entsprechend bereinigen (gleicher Code-Satz, Aliase aus PDF-Schreibweise).
- `REAL_TEAMS` wird dadurch automatisch korrekt – wird sowohl im Onboarding (`OnboardingFlow.tsx`) als auch im Profil (`profil.tsx`) verwendet, also keine Doppelpflege nötig.

> Hinweis: Da der PDF-Inhalt durch das Parsing teilweise abgeschnitten ist, lese ich vor der Umsetzung das vollständige PDF erneut ein und extrahiere die finale 48er-Liste deterministisch (alle `<mark>`-Tags der ersten Spalte je Spieltag).

## 2. Onboarding scrollt nach „Weiter“ / „Starten“ nach oben

`src/components/onboarding/OnboardingFlow.tsx`:
- Beim Klick auf „Weiter“, „Zurück“ und „WM-Planer starten“ ein `window.scrollTo({ top: 0, behavior: "smooth" })` ausführen (in einem `useEffect`, der auf `step` lauscht – sauberer als im Click-Handler, weil das auch beim Swipe/State-Wechsel funktioniert).
- Zusätzlich beim Mount der neuen Step-`motion.div` Fokus auf den Step-Titel (`tabIndex={-1}` + ref) für Screenreader.

## 3. Dashboard: Vorrunde → K.‑o. automatisch umschalten

`src/routes/index.tsx` zeigt aktuell alle Matches kategorisiert (perfect/night/missed), unabhängig von Turnierphase.

**Aktion:**
- Neuen Selektor `useTournamentPhase()` einführen, der aus `useMatchStore` ermittelt, ob noch Vorrundenspiele (`stage === "group"`) im Zustand `scheduled|live` existieren. Wenn nein → Phase = `"ko"`.
- Default-Filter für die drei Tabs:
  - Phase = `"group"`: nur Matches mit `stage === "group"`.
  - Phase = `"ko"`: nur Matches der K.‑o.‑Stages (`r32|r16|qf|sf|third|final`).
- Kleiner Phasen-Indikator oberhalb der Tabs („Gruppenphase“ / „K.‑o.‑Runde“), damit der Wechsel sichtbar ist.
- Übergang ist nahtlos, da der Selektor reaktiv aus dem Live-Store kommt.

## 4. Match-Detailansicht: Anreise raus, Team-Historie rein

`src/components/match/MatchDetailSheet.tsx`:
- `<Insight icon={<Plane/>} label="Anreise & Transit" ... />` entfernen (inkl. ungenutzten `Plane`-Imports). „Stadion“ bleibt.
- Neuen Block **„Bilanz in der Gruppe – {Team A}“** einfügen:
  - Quelle: `useMatchStore` → alle Matches der gleichen `group`, an denen `match.teamA` beteiligt war und `status === "finished"`.
  - Anzeige als kompakte Liste: `🇲🇦 Marokko  2 : 1` (Gegnername links, Ergebnis aus Sicht von Team A rechts, farbig je W/D/L).
  - Falls noch keine Spiele beendet: „Noch keine Gruppenspiele absolviert.“

## 5. TV-Sender eindeutig (ARD ODER ZDF, nie beide)

`MatchDetailSheet.tsx` & `MatchCard.tsx` rendern aktuell `match.broadcasters ?? [match.broadcaster]` als Liste – das führt visuell zu „ARD + ZDF gleichzeitig“.

**Aktion:**
- Helper `primaryBroadcaster(match)` in `src/lib/broadcaster.ts`:
  - Wenn nur ein FreeTV-Sender (ARD oder ZDF) vorhanden ist → diesen zurückgeben.
  - Wenn beide gelistet sind (Datenfehler) → den ersten wählen und im Detail-Sheet einen kleinen Hinweis „Free-TV: ARD“ als **einzelne** Badge anzeigen.
  - MagentaTV wird separat als „Pay-TV: MagentaTV“ angezeigt.
- Im Detail-Sheet zwei klar getrennte Zeilen: **Free-TV:** ARD *oder* ZDF (eine Badge, ein Button) + **Pay-TV:** MagentaTV.
- Schedule-JSON (`src/data/world_cup_2026_schedule.json`) wird **nicht** umgeschrieben; die Eindeutigkeit passiert in der Anzeigeschicht.

## 6. Spoiler-Schutz-Label im Header

`src/components/layout/AppHeader.tsx` zeigt das Label bereits via `hidden xs:inline`. Auf 390 px greift `xs:` aber meist nicht.

**Aktion:**
- Class auf `inline` setzen (immer sichtbar), Text klein und dezent: `text-[11px] font-medium text-muted-foreground`.
- Analog in `src/components/layout/SideNav.tsx` (Desktop) das Label fest neben dem Switch anzeigen.

## 7. Dynamische K.‑o.‑Paarungen via API ersetzen

`src/services/footballApi.ts` + `supabase/functions/fetch-live-scores/index.ts` liefern bereits Live-Daten.

**Aktion:**
- In der Edge Function zusätzlich die Endstände der Gruppenphase ziehen und daraus die finale Tabelle berechnen.
- Im Client einen neuen Reducer `resolveKnockoutPlaceholders()` (in `src/store/match-store.ts`):
  - Sobald alle Matches einer Gruppe `finished` sind, berechne `1A`, `2A`, `3A` etc. aus `getGroupStandings()` (bereits vorhanden, muss aber echte Stats statt Nullen liefern – Live-Updates schreiben `score` ein).
  - Mappe Platzhalter-Codes (`1B`, `2A`, …, `3EFGIJ`) in den K.‑o.‑Matches auf die echten Team-Codes via `applyLiveUpdate`-Variante `replaceTeams(id, teamA, teamB)`.
- `teamMapping`/`getTeam` bekommen einen Fallback für `3EFGIJ`-Codes (heute schon teilweise vorhanden für `3A` etc.).

## 8. Teamauswahl im Profil: 3-Klick-Toggle direkt auf der Karte

`src/routes/profil.tsx` Teams-Karte:
- Entfernt: die beiden kleinen Buttons unter jedem Kärtchen.
- Neuer Zustand pro Karte: `none → favorite → interesting → none`.
- Klick-Handler: ruft je nach aktuellem Status `toggleFavorite` und/oder `toggleInteresting` so, dass das Resultat der gewünschten Sequenz entspricht.
- Visuell:
  - `favorite`: grüner Rand + grünes Tint (`border-primary bg-primary/15`).
  - `interesting`: Akzent-Farbe (`border-accent bg-accent/15`).
  - `none`: neutral.
- Kleiner Hinweistext über dem Grid: „Tippe: 1× Favorit · 2× Interessant · 3× Entfernen“.

## 9. Wecker-/Erinnerungs-Funktion mobil härten

`src/lib/notifications.ts` + `src/routes/index.tsx` (AlarmRow):

**Probleme heute:**
- `setTimeout` läuft nicht im Hintergrund, sobald der Tab geschlossen wird.
- iOS Safari blockt `Notification` außerhalb PWA.

**Aktion:**
- Service-Worker basierte Lösung skizzieren: `public/sw.js` registrieren, `showNotification` aus dem SW heraus aufrufen (funktioniert auf Android Chrome zuverlässig).
- Für iOS: klare UX-Meldung beibehalten, zusätzlich Fallback „Zum Kalender hinzufügen“ vom Dashboard prominent anbieten, wenn `detectPushSupport() === "ios-needs-pwa"`.
- Persistente Alarm-Queue im `localStorage` + beim App-Start neu planen (heute geht der Timer beim Reload verloren).
- Mobile-Test-Checkliste: iOS 16.4+ PWA, Android Chrome Tab offen, Android Chrome PWA, Desktop. Ergebnis als Toast-Hinweis im Profil-Card dokumentieren.

## 10. Suche im „Alle Spiele“-Tab: auch nach Datum filtern

`src/routes/spiele.tsx` filtert aktuell nach Team und Stadt.

**Aktion:**
- Helper `parseDateQuery(q)` (neu, in `src/lib/time.ts`): erkennt Eingaben wie `14.06`, `14.06.2026`, `14/6`, `2026-06-14`, `14. Juni`, `Juni`, `Juni 14`.
- Match-Filter: zusätzlich Treffer, wenn `getLocalParts(m.utcTimestamp).dayKey` mit dem geparsten Datum übereinstimmt **oder** Monat passt.
- Placeholder der `Input` auf `"Team, Stadt oder Datum (z. B. 14.06)…"` aktualisieren.
- Kein neuer DatePicker, bewusst nur Freitext, wie gewünscht.

---

## Technische Details / betroffene Dateien

```
src/data/teams.ts                      # Schritt 1
src/utils/teamMapping.ts               # Schritt 1
src/components/onboarding/OnboardingFlow.tsx  # Schritt 2
src/routes/index.tsx                   # Schritt 3
src/components/match/MatchDetailSheet.tsx     # Schritt 4, 5
src/components/match/MatchCard.tsx     # Schritt 5
src/lib/broadcaster.ts (neu)           # Schritt 5
src/components/layout/AppHeader.tsx    # Schritt 6
src/components/layout/SideNav.tsx      # Schritt 6
src/store/match-store.ts               # Schritt 7
src/services/footballApi.ts            # Schritt 7
supabase/functions/fetch-live-scores/index.ts  # Schritt 7
src/data/groups.ts                     # Schritt 7 (echte Stats aus Live-Scores)
src/routes/profil.tsx                  # Schritt 8
src/lib/notifications.ts               # Schritt 9
public/sw.js (neu)                     # Schritt 9
src/lib/time.ts                        # Schritt 10
src/routes/spiele.tsx                  # Schritt 10
```

Keine neuen npm-Pakete nötig. Mobile Layout (≤ 768 px) bleibt unverändert; Schritte 4–8 sind rein inhaltlich/funktional, keine Layout-Verschiebung auf Mobile.

## Open Questions

1. **Schritt 7 (echte K.‑o.‑Paarungen):** API-Football liefert die finalen Paarungen automatisch, sobald die Gruppenphase beendet ist – das nutzen wir. Falls du es **vor** Turnierende lieber per Hand pflegen willst (für Testing), sag Bescheid, dann baue ich zusätzlich einen Admin-Override.
2. **Schritt 9 (Wecker):** Ein zuverlässiger Hintergrund-Push auf iOS erfordert Lovable Cloud (Web Push API + Subscriptions in Supabase). Soll ich das gleich mit aufsetzen, oder reicht dir vorerst die Service-Worker-Lösung (Android zuverlässig, iOS nur als installierte PWA)?
