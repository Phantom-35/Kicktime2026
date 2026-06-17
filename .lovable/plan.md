# Fix: Blink-Bug bei Live-Spielen (Race Condition Override ↔ API)

## Ursache

Der Live-Polling-Zyklus in `useLiveApi.runLive` lädt erst die API, wendet sie auf den Store an, danach erst die Overrides. Wenn die OpenLigaDB-API einen veralteten Stand (z. B. 0:0) zurückgibt, überschreibt sie für wenige Millisekunden den manuellen Override (z. B. 2:1) — direkt danach zieht der Override-Re-Apply den korrekten Wert wieder rein → sichtbares Flimmern.

Zusätzlich triggert `applyLiveUpdate` ein `set()` auch dann, wenn sich nichts geändert hat (gleiche Score-Werte) → unnötige Re-Renders. Und `rollMatches` markiert beendete Spiele ohne Score in jedem Tick als "changed" → 10-Sek-Render-Storm.

## Lösung in 3 Bausteinen

### 1. Precedence-Marker pro Match (`src/store/match-store.ts`)

`RuntimeMatch` bekommt zwei optionale Felder:

```ts
manualAt?: number;        // Date.now() beim letzten manuellen Override
lastSignature?: string;   // `${status}|${a}:${b}|${minute}` der zuletzt akzeptierten Werte
```

Zwei getrennte Actions statt einer:

- `applyManualUpdate(id, u)` — wird vom Override-Layer aufgerufen. Setzt `manualAt = Date.now()`, gewinnt immer.
- `applyApiUpdate(id, u)` — wird vom API-Layer aufgerufen. Regel:
  - Wenn `manualAt` gesetzt ist UND die API-Signatur **identisch** zur Pre-Override-Signatur (`lastApiSignature`) ist → **skip** (Stale-Daten ignorieren).
  - Wenn die API-Signatur sich vom letzten API-Stand **unterscheidet** → übernehmen (echtes neues Event, z. B. neues Tor) und `manualAt` löschen, damit die API wieder die Führung hat.
  - Equality-Guard: wenn neue Signatur == aktuelle Signatur → kein `set()`.

`lastApiSignature?: string` als drittes Tracking-Feld; wird nur in `applyApiUpdate` aktualisiert.

`finishMatch` und `clearLiveOverlay` ebenfalls mit Equality-Guard, `clearLiveOverlay` setzt `manualAt = undefined`, damit die API wieder ungehindert füttert.

### 2. API-Layer ruft die richtige Action (`src/services/footballApi.ts`)

`applyLiveFixturesToStore` ruft `applyApiUpdate` (neu) statt `applyLiveUpdate`. `finishMatch` darf weiterhin direkt aufgerufen werden, aber ebenfalls mit der gleichen Manual-Precedence-Regel (eigene Variante `applyApiFinish` oder Check inline).

`useLiveApi.runLive` Reihenfolge bleibt: API → dann Overrides. Da `applyApiUpdate` jetzt veraltete API-Daten verwirft, wenn manueller Override aktiv ist, entsteht kein Flimmern mehr.

### 3. Override-Layer markiert + sofortige Anwendung (`src/lib/match-overrides.ts`)

- `applyOverridesToStore` und `setMatchOverride` rufen `applyManualUpdate`/`finishMatch` (manual variant), niemals die API-Variante.
- `clearMatchOverride` ruft das vorhandene `clearLiveOverlay` → `manualAt` wird gelöscht → API darf sofort wieder übernehmen.

### 4. Sauberer Status-Wechsel "beendet" (`rollMatches`)

Bei beendetem Match ohne Score: nur einmal `changed = true` setzen — Equality-Check ergänzen, damit nicht jeder 10-Sek-Tick einen identischen Status erneut schreibt. Verhindert Flackern des "Jetzt live"-Badges in der `LiveNowBar` rund um Spielende.

## Was sich NICHT ändert

- Polling-Intervalle, Edge-Functions, DB-Schema, Admin-PIN, UI-Komponenten (`MatchCard`, `LiveNowBar`, `MatchDetailSheet`).
- API darf nach manuellem Override weiterhin neue Events einspielen (echte Tore, Endpfiff) — sobald sich die API-Signatur ändert, gewinnt sie wieder.

## Geänderte Dateien

- `src/store/match-store.ts` — neue Felder + `applyApiUpdate` Action + Equality-Guards.
- `src/services/footballApi.ts` — `applyLiveFixturesToStore` ruft `applyApiUpdate`.
- `src/lib/match-overrides.ts` — `applyOverridesToStore` ruft `applyManualUpdate`.

## Manuelle Schritte

Keine. Reines Frontend-Refactor, kein SQL, kein Edge-Function-Deploy nötig.
