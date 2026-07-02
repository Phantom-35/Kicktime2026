# Update v7.9.0 — Plan

## Bug 1: Ergebnisse werden nicht angezeigt (obwohl API sie liefert)

**Root Cause:** In `src/services/footballApi.ts::normalize()` werden Zeilen mit
`teams.home.name` oder `teams.away.name === null` per `if (!teamA || !teamB) continue;`
komplett verworfen. Beim `full-store`-Modus liefert die Edge Function für alte
KO-Slots (die noch keine Teams hatten, als sie persistiert wurden) aber genau
solche Payloads. Dadurch werden auch die aktuellen Ergebnisse fürs Sechzehntel
still ignoriert.

Zusätzlich: `applyUpdateInternal` blockiert Score-Updates, wenn `cur.status`
bereits fälschlich auf `finished` steht (Score-Field wird nur via
`finishMatchFromApi` gesetzt, aber der Guard in Zeile 233 kappt neue `liveScore`
zu `undefined`, bevor `finishMatchFromApi` läuft).

**Fix:**
- `normalize()`: Zeilen ohne Teamnamen werden nicht mehr komplett verworfen —
  wenn `matchID` und Score/Status brauchbar sind, wird nur der Score-Teil in ein
  separates `LiveFixture` (mit `matchId` statt Team-Codes) durchgereicht. Alter-
  nativ: `normalize()` liefert `matchId` mit, und `applyLiveFixturesToStore`
  paart zusätzlich auf ID.
- Einfachere Lösung (wird umgesetzt): `normalize()` behält den Skip, aber die
  Edge Function `rowToFixture()` liefert Team-Namen aus `match_results`
  (persistiert) — für Sechzehntelfinale müssen wir sicherstellen dass beim
  Persistieren die Namen aus dem Static-Override kommen. Da R32 clientseitig
  hardgecodet ist (`ko-static.ts`), ist die einfachste Behebung: Beim Empfang
  einer `LiveFixture` ohne Team-Match zusätzlich per `matchId` (falls verfügbar)
  matchen. Wir erweitern das Fixture-Schema um `matchId` und matchen erst per
  Team-Codes, dann per ID.
- `applyUpdateInternal`: Bei `cur.status === "finished" && !cur.score` (Loading-
  Placeholder-State) den Finished-Lock nicht anwenden — Score/Status dürfen
  überschrieben werden.

## Bug 3: Falscher Status "Ergebnis wird geladen" bei zukünftigen Spielen

**Root Cause:** OpenLigaDB liefert für neu angelegte KO-Slots gelegentlich
`matchIsFinished: true` (ohne Score), weil das Match dort administrativ als
"nicht vorhanden" markiert wird. Die Edge Function mappt das auf `FT`, das
Frontend erzeugt daraus einen `finished`-State ohne Score → im Detail-Sheet
erscheint "Ergebnis wird geladen…", obwohl der Anpfiff erst morgen um 01:00 ist.

**Fix (Zeitzonen-hart & doppelt abgesichert):**
- `normalize()` in `footballApi.ts`: Wenn `kickoff > now`, wird `status` IMMER
  auf `scheduled` gezwungen — egal was die API sagt. Zusätzlich wird
  `liveScore` in diesem Fall verworfen (kein Fake-0:0).
- `MatchDetailSheet.tsx`: Die "Ergebnis wird geladen…"-Nachricht erscheint nur
  noch, wenn `Date.now() >= kickoff + 115min` (also das Spiel real vorbei sein
  MÜSSTE). Sonst wird der Score-Block gar nicht gerendert.

Beide Guards zusammen verhindern jeden Zeitzonen-/Datumsdreher.

## Feature 2: Force-Fetch-Button im Admin-Dashboard

- Edge Function: Neuer Body-Parameter `force: true` — überspringt den 5-Min-
  Cache-Read und zwingt einen frischen Upstream-Call. Cache wird trotzdem neu
  geschrieben. Wenn `force` gesetzt, wird der aktuell aktive `koPhase`-URL
  gezogen (oder Default), Cache-Bypass gilt nur für diesen einen Call.
- `footballApi.ts`: Neuer Export `forceFetchActivePhase(koPhase)` — ruft die
  Edge Function mit `{ mode: "live", koPhase, force: true }` und lädt danach
  den full-store neu.
- `SystemMonitor.tsx`: Prominenter Button "🔄 Force Fetch (aktive Route)"
  über dem Fehler-Log; zeigt Toast mit Ergebnis (Anzahl Fixtures + URL) und
  triggert danach `applyLiveFixturesToStore`.

## Datei-Änderungen

- `src/lib/version.ts` — auf `7.9.0`.
- `src/components/WhatsNewModal.tsx` — v7.9-Eintrag.
- `supabase/functions/fetch-live-scores/index.ts` — `force`-Parameter,
  Cache-Bypass wenn gesetzt. Kein Schema-Change, keine RLS-Änderung.
- `src/services/footballApi.ts`
  - `normalize()`: Zeit-basierte Status-Härtung (kickoff > now → scheduled,
    kein Fake-Score).
  - `LiveFixture`-Typ + `RawFixture` bekommen optionales `matchId`.
  - `applyLiveFixturesToStore()`: Zweite Match-Runde via `matchId` (falls
    Team-Match fehlschlägt) — behebt Bug 1 für hardgecodete R32-Slots.
  - Neuer Export `forceFetchActivePhase(koPhase)`.
- `src/store/match-store.ts::applyUpdateInternal`: Wenn `cur.status ===
  "finished" && !cur.score`, gilt der Finished-Lock nicht — neue API-Daten
  dürfen den Zombie-State überschreiben.
- `src/components/match/MatchDetailSheet.tsx`: "Ergebnis wird geladen…" nur
  noch, wenn `Date.now() >= kickoff + 115min`.
- `src/components/admin/SystemMonitor.tsx`: Force-Fetch-Button.

## Keine SQL-/Supabase-Änderungen nötig

Diese v7.9.0-Runde ist rein Code-seitig — die bestehenden Tabellen
(`match_results`, `match_overrides`, `live_fixtures_cache`) reichen aus. Kein
Migration-Skript, keine RLS-Anpassung, kein Cron.
