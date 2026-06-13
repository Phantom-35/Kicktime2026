# Plan: Version 6.2 — Echte Web-Push-Benachrichtigungen + Cleanup

## 1. Version 6.2

- `src/lib/version.ts`: `APP_VERSION = "6.2.0"`
- `package.json` `version` Feld auf `6.2.0`
- `public/manifest.webmanifest`: falls Version-Tag vorhanden, mit ziehen
- `WhatsNewModal`: Eintrag „v6.2 — Echte Push-Benachrichtigungen auf den Sperrbildschirm" ergänzen

## 2. „Spoilerfreie Highlights" restlos entfernen

Vorkommen suchen und löschen in: `src/store/app-store.ts`, `src/routes/spiele.tsx`, `src/routes/index.tsx`, `src/routes/profil.tsx`, `src/components/whats-new/WhatsNewModal.tsx`, `src/components/match/MatchDetailSheet.tsx`, `src/components/layout/AppHeader.tsx`, `src/components/layout/SideNav.tsx`, `src/components/onboarding/OnboardingFlow.tsx`. Inklusive Toggle-State, Filter-Logik, Settings-Eintrag und Onboarding-Slide.

## 3. Architektur Web Push (W3C / VAPID, ohne FCM/OneSignal)

### Geräte-Identität (anonym)

- Neuer Helper `src/lib/device-id.ts`: erzeugt einmalig eine UUID in `localStorage` (`kicktime.device_id`). Dient als „User-ID-Ersatz" bis echte Auth dazukommt.
- Diese ID kommt überall dort hin, wo die DB heute pseudo-anonym schreibt (Push-Subscriptions, Alarm-Abos).

### Service Worker

- Neue Datei `public/sw.js` — minimaler, eigener Worker NUR für Push (keine Offline-Caches, keine vite-plugin-pwa Integration, kein Caching von HTML — bleibt mit Lovable-Preview kompatibel, weil Registrierung über die Guards aus dem PWA-Skill läuft).
- Handler: `push` → `self.registration.showNotification(title, { body, icon, badge, tag: matchId, data: { url } })`. `notificationclick` → öffnet/fokussiert die App auf der Match-Detail-URL.
- Registrierung in `src/lib/push-client.ts` mit den Lovable-Preview-Guards (hostname-checks, `?sw=off`, iframe), damit der Worker nur im veröffentlichten Build aktiv wird.

### VAPID-Keys

- Du generierst online (z. B. vapidkeys.com) → trägst sie als Secrets ein:
  - `VAPID_PUBLIC_KEY` (Public, wird zusätzlich in `.env` als `VITE_VAPID_PUBLIC_KEY` benötigt, damit das Frontend `subscribe()` aufrufen kann)
  - `VAPID_PRIVATE_KEY` (Private, nur Edge Function)
  - `VAPID_SUBJECT` (z. B. `mailto:du@example.com`)
- Da nur Runtime-Secrets verfügbar sind, schreibe ich den Public Key zusätzlich als Konstante in `src/lib/push-config.ts` — du trägst ihn dort beim Setup einmalig ein (Public Keys sind öffentlich, also unkritisch).

## 4. Frontend-Flow Glocke → Push-Abo

- `AlarmBell.handleClick`: beim Aktivieren
  1. Permission anfragen (`Notification.requestPermission()`)
  2. Service Worker registrieren (falls noch nicht)
  3. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) })`
  4. Subscription + `device_id` + `match_id` + `kickoff_utc` in Supabase `push_subscriptions` + `match_alarm_subscriptions` schreiben.
- Beim Deaktivieren: Row(s) löschen, lokale Subscription bleibt erhalten (für andere Matches).
- iOS-Hinweis: `detectPushSupport()` bleibt — `ios-needs-pwa` Toast wie bisher, sonst echter Push-Flow.

## 5. Datenbankschema (manuell im SQL-Editor)

Zwei Tabellen:

- `push_subscriptions` — ein Eintrag pro Gerät: `device_id uuid PK`, `endpoint text unique not null`, `p256dh text not null`, `auth text not null`, `user_agent text`, `created_at`, `last_seen_at`.
- `match_alarm_subscriptions` — m:n zwischen Gerät und Match: `(device_id uuid, match_id text, kickoff_utc timestamptz, lead_minutes int default 15, notified_at timestamptz null, created_at)` PK `(device_id, match_id)`.

RLS: `enable`, `for all to anon, authenticated using (true) with check (true)` — gleicher Schutz wie `match_overrides` (PIN-frei, da pro-Gerät-Schreiben gewollt ist; sensible Daten gibt es nicht). Grants entsprechend für `anon, authenticated, service_role`.

## 6. Edge Function `send-push-reminders`

- Neue Function `supabase/functions/send-push-reminders/index.ts`.
- Trigger: pg_cron alle 1 Minute via `pg_net.http_post` → `https://<project>.functions.supabase.co/send-push-reminders` mit `Authorization: Bearer <anon-key>`.
- Logik:
  1. Select `match_alarm_subscriptions` JOIN `push_subscriptions` WHERE `notified_at IS NULL AND kickoff_utc BETWEEN now() AND now() + (lead_minutes * interval '1 minute')`.
  2. Für jede Row: signierten Web-Push schicken (eigene VAPID-Signing-Implementation in Deno mit `Deno.crypto` — KEINE Library, weil `web-push` npm in Deno-Edge-Runtime nicht stabil läuft; statt dessen `npm:@negrel/webpush@1`, die läuft sauber in Deno).
  3. Bei `410 Gone` / `404` → `push_subscriptions`-Row löschen (Endpoint abgemeldet).
  4. Bei Erfolg: `notified_at = now()` setzen.
- CORS-Header + OPTIONS-Preflight identisch zu `fetch-live-scores`.

## 7. pg_cron Setup (manuell)

SQL einmalig:
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('send-push-reminders','* * * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.functions.supabase.co/send-push-reminders',
    headers := jsonb_build_object('Authorization','Bearer <anon-key>','Content-Type','application/json'),
    body := '{}'::jsonb
  );
$$);
```

## 8. Manuelle Schritte für dich (in dieser Reihenfolge)

1. VAPID-Keys online generieren.
2. In Lovable Secrets eintragen: `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Public Key zusätzlich in `src/lib/push-config.ts` reinkopieren (zeige ich als TODO im Code).
3. Im Supabase-SQL-Editor: das beigefügte SQL für die zwei Tabellen + Policies + Grants ausführen.
4. Edge Function `send-push-reminders` deployen (Code-Block bekommst du nach Build).
5. Im SQL-Editor: pg_cron-Snippet mit deiner `<project-ref>` und `<anon-key>` einsetzen und ausführen.
6. App im Browser/PWA öffnen, Glocke bei einem Spiel aktivieren, Browser-Permission erlauben → fertig.

## Dateien (geplant)

- bearbeiten: `src/lib/version.ts`, `package.json`, `src/store/app-store.ts`, `src/routes/{index,spiele,profil}.tsx`, `src/components/whats-new/WhatsNewModal.tsx`, `src/components/match/MatchDetailSheet.tsx`, `src/components/layout/{AppHeader,SideNav}.tsx`, `src/components/onboarding/OnboardingFlow.tsx`, `src/components/match/AlarmBell.tsx`, `src/hooks/useAlarmScheduler.ts` (auf Web-Push umstellen, nicht mehr setTimeout-only), `src/lib/notifications.ts`
- neu: `public/sw.js`, `src/lib/device-id.ts`, `src/lib/push-client.ts`, `src/lib/push-config.ts`, `src/lib/push-subscriptions.ts`, `supabase/functions/send-push-reminders/index.ts`

Nach Approve liefere ich den vollständigen Edge-Function-Code, das SQL für Tabellen+Policies+Grants und das pg_cron-Snippet als Copy-Paste-Blöcke.
