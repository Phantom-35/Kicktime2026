## Ziel

Erweiterung des Benachrichtigungssystems um Auto-Favoriten-Logik, eine kompakte Glocke neben jedem "Zum Kalender hinzufügen"-Button und konsistente Toast-Bestätigungen. Version → 3.4.0.

## 1. Store (`src/store/app-store.ts`)

- Neues Feld `autoAlarmFavorites: boolean` (Default `true`) + Setter `setAutoAlarmFavorites(v)`.
- Bestehendes `alarms`/`toggleAlarm` bleibt unverändert (manuelle Overrides).

## 2. Helper: effektiver Alarm-Status

Neue kleine Datei `src/lib/alarms.ts`:

```ts
export function isAlarmActive(match, alarms, autoFav, favorites) {
  if (alarms[match.id]) return true;
  if (autoFav && (favorites.includes(match.teamA) || favorites.includes(match.teamB))) return true;
  return false;
}
```

Wird in `useAlarmScheduler` und in der UI (Glocken-Icon) genutzt — eine Quelle der Wahrheit.

## 3. Scheduler (`src/hooks/useAlarmScheduler.ts`)

- `alarms`, `autoAlarmFavorites`, `favoriteTeams` lesen.
- Loop über alle Matches: nutze `isAlarmActive(...)`.
- Notification-Text auf neuen Wording umstellen:
  - Titel: `🏆 KickTime Erinnerung`
  - Body: `In 15 Minuten startet {TeamA} gegen {TeamB}! Schalte rechtzeitig ein.`
- Dependency-Array entsprechend erweitern.

## 4. Glocken-Komponente (`src/components/match/AlarmBell.tsx`, neu)

Kompakter Icon-Button (`h-8 w-8 rounded-lg border border-border`), Bell-Icon (`h-3.5 w-3.5`).

Props: `match`.

Logik:
- Liest `alarms`, `autoAlarmFavorites`, `favoriteTeams`, `pushEnabled`, `toggleAlarm`.
- `active = isAlarmActive(match, ...)`.
- `isAuto = !alarms[match.id] && active` (Glocke ist nur durch Auto-Favoriten aktiv).
- Styling:
  - Aktiv: `bg-primary/15 border-primary text-primary` + `fill-current` auf Bell.
  - Inaktiv: `text-muted-foreground hover:text-foreground`.
- Klick:
  - `e.stopPropagation()` (damit das umgebende `MatchCard onClick` nicht feuert).
  - Wenn `isAuto` und Nutzer klickt: setze `alarms[id] = false` (expliziter Opt-out — siehe unten unter "Auto-Override").
  - Sonst: `toggleAlarm(id)`.
  - Toast: `Erinnerung für {a.name} vs. {b.name} aktiviert! 🔔` oder `… deaktiviert.`
  - Wenn Hauptschalter aus / Permission fehlt: Toast-Hinweis `Aktiviere Push-Benachrichtigungen im Profil.`

### Auto-Override (Edge Case)

Damit „Auto an, aber dieses eine Spiel will ich nicht" funktioniert, erweitern wir `alarms` semantisch:
- `alarms[id] === true` → manuell an.
- `alarms[id] === false` (explizit gesetzt) → manuell aus, überschreibt Auto.
- `alarms[id] === undefined` → folgt Auto-Logik.

`isAlarmActive` und `toggleAlarm` werden entsprechend angepasst (Tri-State per `undefined`-Check). `toggleAlarm` cycelt: `undefined → true → false → undefined`.

## 5. UI-Integration der Glocke

In allen drei Stellen mit "Zum Kalender hinzufügen"-Button: Button + Glocke in einem `flex items-center gap-2`-Container nebeneinander platzieren.

- `src/routes/index.tsx` (Perfect Matches Section, Z. 110–120)
- `src/routes/spiele.tsx` (Z. 93–103)
- `src/routes/tabellen.tsx` (Z. 150–161)

Der Kalender-Button behält `flex-1`, die Glocke ist `shrink-0`.

## 6. Profil-Tab (`src/routes/profil.tsx`)

Innerhalb der bestehenden „Push-Benachrichtigungen"-Card unterhalb des Hauptschalters:

```
─ Hauptschalter "Push-Benachrichtigungen" [Switch]
─ iOS-Hinweis (klein)
─ Trenner (border-t border-border/50 pt-3 mt-3)
─ Eingerückter Block (pl-3 border-l-2 border-border):
   - Titel: "Automatisch für Favoriten"
   - Beschreibung: "Aktiviert automatisch die Erinnerungs-Glocke für alle Spiele deiner Favoriten-Teams."
   - Switch (disabled wenn !pushEnabled, optisch gedämpft)
```

Switch nutzt `autoAlarmFavorites` / `setAutoAlarmFavorites`.

## 7. Version-Bump

`APP_VERSION` in `src/routes/profil.tsx` → `"3.4.0"`.

## Technische Details

- Keine neuen Dependencies.
- `alarms`-Typ bleibt `Record<string, boolean>` — `undefined` ist bereits implizit valide.
- Bestehende Toast-Komponente (in der letzten Iteration neu designt) wird automatisch genutzt — kein Style-Override nötig.
- `useAlarmScheduler` reagiert dank Zustand-Subscription automatisch auf Änderungen von `autoAlarmFavorites` und `favoriteTeams`, sodass das Aktivieren des Auto-Schalters sofort alle Favoriten-Spiele scheduled.
- `e.stopPropagation()` auf der Glocke verhindert, dass das `MatchDetailSheet` aufpoppt.
