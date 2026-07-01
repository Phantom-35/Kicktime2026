# Update v7.7 — Admin-Tools, Fehler-Log, echte Nutzer, Turnier-Status

Kein Eintrag im WhatsNew. `APP_VERSION` in `src/lib/version.ts` wird auf `7.7.0` erhöht, das WhatsNew-Modal bleibt inhaltlich unverändert (nur Versionsbump, damit der Dialog nicht erneut aufpoppt — kein neuer Punkt sichtbar).

---

## 1) Sechzehntelfinale (/4) als Admin-Override

**Ziel:** Admin kann im System-Tab manuell auf `/4` zwingen, obwohl R32 im Auto-Modus hardgecodet läuft.

**Code-Änderungen:**
- `src/lib/ko-phase.ts`: Typ `KoPhaseNum` um `4` erweitern, `KO_PHASES[4]` mit `stage: "r32"`, Label „Sechzehntelfinale", URL `https://api.openligadb.de/getmatchdata/wm26/2026/4`. `KO_PHASE_LIST` erhält `4` an erster Stelle. `determineActiveKoPhase()` bleibt unverändert (Auto liefert weiter `null` für R32 → hardgecodete Daten gewinnen).
- `src/components/admin/SystemMonitor.tsx`: Button-Reihe rendert automatisch alle Einträge aus `KO_PHASE_LIST`, dadurch erscheint `/4 Sechzehntelfinale` als erster Button vor `/5`.
- `src/hooks/useLiveApi.ts`: `adminOverride`-Check erweitert um `4`. Wenn Admin `/4` setzt, wird die Edge-Function mit `koPhase=4` gepollt; die zurückgelieferten Fixtures überschreiben die hardgecodeten R32-Daten via existierender Merge-Logik in `applyLiveFixturesToStore`.
- `src/store/app-store.ts`: `adminKoPhaseOverride` bleibt `number | null` (4–9 erlaubt) — keine Typänderung nötig, nur Kommentar aktualisieren.
- `supabase/functions/fetch-live-scores/index.ts`: Whitelist der akzeptierten `koPhase`-Parameter um `4` ergänzen, Cache-Key `wm26-ko-4`.

**Supabase-Schritte für den Nutzer:** Keine. Der Override wird ausschließlich im lokalen `zustand/persist`-Store (localStorage) gespeichert; es gibt keine Phasen-Tabelle/Enum in der DB. Nach dem Deploy der Edge-Function ist alles einsatzbereit.

---

## 2) All-Inclusive Fehler-Log

**Ziel:** Nicht nur API-Fehler der Finalrunden, sondern alle System-, DB-, Auth-, Tipp- und Frontend-Fehler landen im gleichen Log.

**Code-Änderungen:**
- Neue Datei `src/lib/error-log.ts`: Exportiert `logError(category, message, meta?)` — schreibt in denselben `apiErrorLog`-Slice des `useAppStore`. Kategorien: `api | supabase | auth | prediction | render | network | system`.
- `src/store/app-store.ts`: `apiErrorLog`-Eintrag um `category`-Feld erweitern (backwards-kompatibel, default `api`). Ringpuffer auf 60 Einträge erhöht.
- Globale Hooks in `src/routes/__root.tsx`: `window.addEventListener("error", …)` und `"unhandledrejection"` verdrahten → `logError("render"/"system", …)`.
- Instrumentierung an den kritischen Stellen (jeweils try/catch bzw. `.catch()` mit `logError`):
  - `src/lib/match-overrides.ts` (Supabase upsert/select/delete)
  - `src/lib/push-subscriptions.ts`, `src/lib/push-client.ts` (Push-Registrierung)
  - `src/lib/feedback.ts` (Feedback-Insert)
  - `src/lib/telemetry.ts` (Client-Ping)
  - `src/lib/predictions.ts` (Score-Berechnung, wenn NaN oder Ausnahmen)
  - `src/integrations/supabase/client.ts` Aufrufer, die bereits `try/catch` haben
- `src/components/admin/SystemMonitor.tsx`: Fehlerkarten zeigen zusätzlich `category`-Badge und behalten Zeitstempel/URL/Message.

---

## 3) Echte Nutzerstatistik statt Bot-/Session-Zählung

**Ziel:** Zählung strikt an Supabase-User-IDs (bzw. echten authentifizierten Nutzern) — keine anonymen Pageviews mehr.

**Aktueller Stand:** `src/lib/telemetry.ts` pingt bei jedem App-Open mit `clientId` aus dem localStorage → produziert bei Refresh/Bots Zombie-Zeilen.

**Code-Änderungen:**
- `src/lib/telemetry.ts`: Ping nur senden, wenn (a) `supabase.auth.getUser()` einen echten User zurückgibt **oder** (b) der Nutzer eine `push_subscriptions`-Zeile hat (echte Geräte-Registrierung). Bots und Refresh-Only-Besucher fallen raus.
- Neue Zähl-Quelle im Admin-Panel: `AdminPanel.tsx` liest die Nutzerzahlen jetzt aus:
  - `push_subscriptions` (distinct `device_id`) als Basis für „echte Tipper"
  - Optional: `predictions`-Tabelle (falls vorhanden) — distinct `user_id`
- 24h/7d-Fenster wird per `created_at >= now() - interval` gefiltert (clientseitig auf den Query-Ergebnissen, keine RPC nötig).
- Alte anonyme Telemetrie-Tabelle bleibt zwar bestehen, wird im UI aber nicht mehr angezeigt.

**Supabase-Schritte für den Nutzer:** Keine Schema-Änderung. Optional (nur wenn Nutzer aufräumen will): alte `client_pings`-Zeilen löschen — SQL wird im Abschluss mitgeliefert.

---

## 4) Neuer Tab „Turnier-Status"

**Ziel:** Öffentlicher Tab, zeigt „Noch im Rennen" vs. „Ausgeschieden" mit Runde des Ausscheidens.

**Code-Änderungen:**
- Neue Route `src/routes/turnier.tsx` (Label „Status", Icon Trophy).
- `src/components/layout/BottomNav.tsx` + `SideNav.tsx`: Neuen Tab einreihen (an sinnvoller Stelle, z. B. zwischen „Tabellen" und „Tipps").
- Neue Lib `src/lib/tournament-status.ts`:
  - Liest `useMatchStore` + hardcodierte R32 aus `src/data/ko-static.ts`.
  - Für jedes Team ermittelt sie: `alive | eliminated` und im Fall `eliminated` die Runde (`group | r32 | r16 | qf | sf | final`).
  - Regel: Team ist „ausgeschieden", wenn es in einem beendeten KO-Spiel den niedrigeren Score hat; „im Rennen" sonst.
- UI: Zwei Sektionen mit Flag + Teamname; ausgeschiedene Teams zeigen „Ausgeschieden im Achtelfinale" o. ä. Sortierung: alive nach Gruppe/Alphabet, eliminated nach Runde (spätester Ausschluss oben).

---

## 5) WhatsNew

Kein neuer Eintrag. `WhatsNewModal.tsx` bleibt textlich unverändert; nur `APP_VERSION` steigt auf `7.7.0`, damit `lastSeenVersion`-Vergleiche konsistent bleiben (das Modal poppt einmalig, zeigt aber den alten 7.6-Inhalt — falls der Nutzer das komplett unterdrücken möchte: bitte kurz melden, dann setzen wir stattdessen `lastSeenVersion` intern nach oder überspringen den Bump).

---

## 6) End-to-End Bug-Sweep

Vor Abschluss laufe ich systematisch durch:
- Dashboard (`/`): Phase-Filter, LiveNowBar, Ampeln, Spoiler-Reveal-Persistenz
- Spiele (`/spiele`): Auto-Scroll, „Top"-Pille (Hotfix 7.6.1), KO-Badges, Truncation
- Tabellen, Tipps, Profil, neuer Turnier-Status
- Admin: PinGate → LiveOverride → SystemMonitor (neue /4-Taste, Fehler-Log-Kategorien, echte Nutzerzahlen)
- Push-Flow (Permission-Modal, dynamischer Body)
- Feedback-Modal (8 Öffnungen)
- Edge-Function `fetch-live-scores` mit `?koPhase=4|5|…|9`

Gefundene Bugs werden im gleichen Turn gefixt und explizit gelistet.

---

## Zusammenfassung der manuellen Schritte für dich

1. **Edge-Function neu deployen:** `supabase/functions/fetch-live-scores/index.ts` (akzeptiert jetzt `koPhase=4`).
2. **Datenbank:** Keine neuen Tabellen, Enums oder RLS-Policies nötig. Der /4-Override lebt clientseitig.
3. **Optional Cleanup (nur wenn gewünscht):** `DELETE FROM public.client_pings WHERE created_at < now() - interval '7 days';` — wird im Abschluss als Copy-Paste-Snippet geliefert.
