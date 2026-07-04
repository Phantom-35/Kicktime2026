## v7.10.1 — Bugfix: Platzhalter im Achtelfinale werden nicht durch echte Teams ersetzt

### Ursache

Zwei zusammenwirkende Regressionen verhindern, dass Slots wie „Sieger Spiel 73" durch die realen Teams (Kolumbien, Ghana, …) ersetzt werden — obwohl die API-Route `/5` sie liefert und das Admin-Panel den Fetch als erfolgreich bestätigt:

1. **`applyLiveFixturesToStore` kann Platzhalter nicht paaren.** Beim Rehydrieren aus `match_results` paart die Funktion nur über (a) exakten Team-Code-Match oder (b) `apiMatchId` auf dem lokalen Match. Die statisch geseedeten R16-Slots aus `world_cup_2026_schedule.json` tragen weder echte Team-Codes noch eine `apiMatchId` — jede Zeile wird verworfen (`if (!match) continue`).
2. **`runBracketPrefetch` überspringt die aktive Phase.** `getNextPhaseForBracketPrefetch` filtert `info.num <= activePhase`. Sobald der Admin manuell `/5` erzwingt (oder Auto R16 als aktive Phase wählt), wird die einzige Upgrade-Logik mit Kickoff±6h/Index-Fallback (`applyBracketUpgradeFromApi`) für R16 nie aufgerufen. Ergebnis: Platzhalter bleiben stehen, obwohl der Fetch grün ist.

Die Persistenz (`match_results`) ist in Ordnung — die Zeilen enthalten die echten Team-Namen. Es ist ausschließlich der Store-Merge im Frontend, der die Slots nicht upgradet.

### Fix

**`src/hooks/useLiveApi.ts`** — nach jedem `runLive()` / `runIdle()` zusätzlich `applyBracketUpgradeFromApi(stage, res.fixtures)` für die aktive KO-Phase aufrufen (nicht nur für die Nachfolge-Phase). Dadurch werden R16-Slots direkt aus der Antwort von `/5` upgegradet:

```ts
const upgradeActivePhase = (res: LiveFetchResult) => {
  if (!res.koPhase || res.koPhase === 4) return;
  const info = getKoPhaseInfo(res.koPhase);
  if (!info) return;
  applyBracketUpgradeFromApi(info.stage as "r16"|"qf"|"sf"|"third"|"final", res.fixtures);
};
```

Aufruf in `runLive` und `runIdle` direkt nach `trackResult(res)`, vor `loadFullStore()`.

**`src/services/footballApi.ts`** — `applyLiveFixturesToStore` bekommt einen dritten Paarungs-Pfad: Wenn weder Team-Match noch matchId greifen, wird pro KO-Stage (r16/qf/sf/third/final) auf `applyBracketUpgradeFromApi` zurückgefallen. Konkret: Fixtures ohne Match werden nach Stage gruppiert (per Zuordnung Kickoff-Datum → Stage über die lokalen Slots) und stage-weise an `applyBracketUpgradeFromApi` weitergereicht.

Alternativ (einfacher & robuster): Wir gruppieren die verbliebenen Fixtures direkt nach dem `utcTimestamp`-Fenster jeder KO-Stage und rufen für jede Stage mit übrig gebliebenen Fixtures `applyBracketUpgradeFromApi` auf.

**`src/lib/ko-phase.ts`** — Kommentar an `getNextPhaseForBracketPrefetch` präzisieren: Die Funktion bleibt inhaltlich gleich (Prefetch nur für spätere Phasen), weil der neue Upgrade-Pfad in `useLiveApi` die aktive Phase abdeckt.

**`src/lib/version.ts`** — Bump auf `7.10.1`.
**`src/components/whats-new/WhatsNewModal.tsx`** — Eintrag: „Bugfix: Achtelfinal-Platzhalter werden jetzt automatisch durch die realen Teams ersetzt, sobald die API sie liefert."

### Keine Änderungen an Edge Function, DB oder Schema

Persistenz und API-Route funktionieren bereits korrekt. Der Fix ist rein clientseitig im Store-Merge.

### Dateien

- `src/hooks/useLiveApi.ts` — Upgrade-Aufruf für aktive Phase nach jedem Live-/Idle-Fetch.
- `src/services/footballApi.ts` — `applyLiveFixturesToStore` fällt für unpaarbare Fixtures auf stage-weise Bracket-Upgrade zurück.
- `src/lib/version.ts` — `APP_VERSION = "7.10.1"`.
- `src/components/whats-new/WhatsNewModal.tsx` — neuer Changelog-Eintrag.
