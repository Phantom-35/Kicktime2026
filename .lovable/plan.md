## Problem

`computeTeamStatuses` in `src/lib/tournament-status.ts` markiert in der Gruppenphase konservativ **nur Platz 4** als ausgeschieden. Die WM 2026 hat aber 12 Gruppen mit **Top 2 direkt qualifiziert + 8 besten Gruppendritten** → **4 schlechteste Gruppendritte fliegen raus**. Diese Logik fehlt komplett, weshalb Teams wie Schottland oder Iran (Gruppendritte außerhalb der Top 8) weiter als „Noch im Rennen" angezeigt werden, obwohl sie faktisch draußen sind.

Zusätzlich: Für Teams, die als Gruppendritter zwar unter den besten 8 sind, aber im Sechzehntelfinale verlieren, greift die bestehende KO-Loser-Detection bereits — sobald echte Teamcodes in den R32-Slots stehen. Dieser Teil funktioniert, sobald die API die Platzhalter ersetzt (siehe v7.10.x Bracket-Upgrade).

## Fix

**Datei:** `src/lib/tournament-status.ts`

1. Beim Iterieren durch die Gruppen: Standings sammeln — pro Gruppe den Drittplatzierten mit seiner Bilanz in ein Array `thirds` legen (nur wenn alle 6 Gruppenspiele beendet sind).
2. Platz 4 sofort als `group` markieren (wie bisher).
3. **Neu:** Wenn alle 12 Gruppen komplett sind, `thirds` nach FIFA-Kriterien sortieren (Pts → GD → GF → Team-Code als Tie-Break) und die **schlechtesten 4** als `group` eliminieren. Die besten 8 bleiben „alive" und werden ggf. später per KO-Loser-Detection markiert.
4. **Fallback für unvollständigen Sync:** Falls noch nicht alle Gruppen fertig sind, aber ein Drittplatzierter mathematisch nicht mehr unter die 8 besten Dritten kommen kann, bleibt er vorerst „alive" (kein Overreach). Der Hauptfix greift, sobald alle Gruppen beendet sind — das ist der Zustand, in dem sich der Nutzer laut Screenshot befindet.

## Was NICHT geändert wird

- Keine DB-Schema-Änderungen. `eliminated`-Status wird weiterhin **rein clientseitig** aus dem Match-Store abgeleitet — das ist die konsistente Single Source of Truth (Ergebnisse leben in `match_results`, Status ist eine reine Ableitung davon). Kein neues API-Feld, kein zusätzlicher Sync-Pfad.
- Keine Änderung an `standings.ts`, `match-store.ts`, Edge Function.
- Keine Änderung am Turnier-Tab-UI (`turnier.tsx`) — die Anzeige nutzt bereits `alive`/`eliminatedIn`, sortiert korrekt.

## Version

Version-Bump auf `7.10.3` + kurzer WhatsNew-Eintrag „Ausgeschiedene Gruppendritte werden korrekt erkannt".
