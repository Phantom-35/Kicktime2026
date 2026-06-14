# Update v6.5.0 — Smarter Push & personalisierte Inhalte

## 1. Version
- `src/lib/version.ts` → `6.5.0`
- `package.json` → `6.5.0`

## 2. Intelligenter Push-Berechtigungs-Check (`src/components/match/AlarmBell.tsx`)

Neuer Flow vor jedem Aktivieren:

1. `detectPushSupport()` aufrufen.
2. Wenn nicht `"granted"`:
   - **iOS ohne PWA** → bestehender Toast bleibt.
   - **`"denied"` oder `"default"`** → KEIN `setAlarm(true)`, KEIN Subscribe.
     Stattdessen ein neues, unaufdringliches Modal anzeigen mit Text:
     *"Um Spiel-Erinnerungen zu erhalten, aktiviere bitte zuerst die Mitteilungen in deinen Geräteeinstellungen für diese App."*
   - Bei `"default"` versuchen wir vorher einmalig `Notification.requestPermission()`; wenn der User ablehnt → gleiches Modal.
3. Nur wenn final `"granted"` → wie bisher Sub + DB-Upsert + Alarm setzen.

Bell-Optik: Wenn Permission ≠ granted (und nicht iOS-needs-pwa), Bell visuell als "deaktiviert" rendern (dimmed), Klick zeigt direkt das Hinweis-Modal. Aktiv-Status (gefüllte Glocke) nur bei tatsächlich granted + aktivem Alarm.

### Neue Komponente: `src/components/match/PushPermissionModal.tsx`
- Dialog (shadcn), 1 Button "Verstanden", optional Link "Einstellungen öffnen" (nur Text-Hinweis, da Browser keinen API-Call dafür hat).
- Wiederverwendbar via `open`/`onClose`-Props.

## 3. Dynamische Push-Inhalte

### 3a. `match_alarm_subscriptions` um Teamnamen erweitern
Neue Spalten **`team_a_name TEXT`**, **`team_b_name TEXT`** (nullable, kein Default).
- `addMatchAlarm()` (`src/lib/push-subscriptions.ts`) erhält 2 neue Parameter `teamAName`, `teamBName` und schreibt sie beim Upsert mit.
- Aufrufer `src/components/match/AlarmBell.tsx` übergibt `getTeam(match.teamA).name` und `getTeam(match.teamB).name`.

Begründung: Edge Function läuft serverseitig und kennt nur DB-Daten; Teamnamen direkt im Alarm-Row hält die Function simpel und vermeidet Joins zu Schedule-JSON.

### 3b. Edge Function `supabase/functions/send-push-reminders/index.ts`
- `select(...)` ergänzen um `team_a_name, team_b_name`.
- Payload-Aufbau ändern:
  ```ts
  const teamA = row.team_a_name ?? "Team A";
  const teamB = row.team_b_name ?? "Team B";
  const payload = JSON.stringify({
    title: "Anpfiff steht bevor! 🏆",
    body: `${teamA} - ${teamB} startet in ${minutesLeft} Minuten!`,
    url: "/",
    tag: `match-${row.match_id}`,
  });
  ```
- `minutesLeft = Math.max(1, Math.round((kickoff - now) / 60000))`.

### 3c. Service Worker `public/sw.js`
- Bleibt strukturell identisch — er nutzt bereits `payload.title` / `payload.body`.
- Default-Fallback-Texte aktualisieren (Title „Anpfiff steht bevor! 🏆", Body „Gleich startet dein Spiel!") für den seltenen Fall eines leeren Payloads.

## 4. WhatsNewModal v6.5.0
`src/components/whats-new/WhatsNewModal.tsx` — Feature-Liste austauschen:
- 🔔 **Smarter Push-Check** — "Die Erinnerungs-Glocken prüfen jetzt deinen Systemstatus. Fehlen die Rechte, erinnert dich die App direkt an deine Geräteeinstellungen."
- 💬 **Personalisierte Benachrichtigungen** — "Push-Nachrichten zeigen dir ab jetzt direkt auf dem Sperrbildschirm an, welches Match in 15 Minuten startet!"

Version-Badge auf `v6.5.0`.

## 5. Geänderte / neue Dateien

**Neu:**
- `src/components/match/PushPermissionModal.tsx`

**Bearbeitet:**
- `src/lib/version.ts`, `package.json`
- `src/components/match/AlarmBell.tsx` (Permission-Gate + Modal + Teamnamen-Pass-Through)
- `src/lib/push-subscriptions.ts` (`addMatchAlarm` Signatur)
- `supabase/functions/send-push-reminders/index.ts` (Select + Payload)
- `public/sw.js` (Fallback-Texte)
- `src/components/whats-new/WhatsNewModal.tsx`

**Unverändert:** match-store, feedback, tv-overrides, etc.

## 6. Manuelle Schritte am Ende

Du bekommst nach dem Build einen Copy-Paste-Block:

### A) Supabase SQL (Spalten ergänzen, idempotent)
```sql
alter table public.match_alarm_subscriptions
  add column if not exists team_a_name text,
  add column if not exists team_b_name text;
```

### B) Edge Function neu deployen
Die Datei `supabase/functions/send-push-reminders/index.ts` wurde im Repo aktualisiert. Im Supabase-Dashboard:
1. Edge Functions → `send-push-reminders` → "Deploy new version" mit dem aktuellen Code.
2. Sicherstellen dass Secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` weiterhin gesetzt sind.

### C) Verifikation
1. Auf Dashboard alte Glocke deaktivieren → neu aktivieren (damit Teamnamen in DB landen).
2. Im SQL-Editor prüfen:
   ```sql
   select match_id, team_a_name, team_b_name, kickoff_utc
   from public.match_alarm_subscriptions
   order by kickoff_utc desc limit 5;
   ```
3. Für ein nahes Spiel (oder `kickoff_utc` testweise nach vorne ziehen) Edge-Function manuell triggern und Push am Gerät prüfen — Titel "Anpfiff steht bevor! 🏆", Body "Team A - Team B startet in X Minuten!".

### D) Permission-Test
- iOS PWA / Android Chrome: Benachrichtigungen in Systemeinstellungen deaktivieren → Glocke klicken → Modal muss erscheinen, kein Abo angelegt.
- Wieder aktivieren → Glocke klicken → Abo wird angelegt + Bestätigungs-Toast.
