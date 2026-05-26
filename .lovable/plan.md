## Ziel
Das bestehende Supabase-Projekt **"Kick Time 2026"** (`bbdnnohujyvickhegbuf`) mit der Lovable-App verbinden, ohne Lovable Cloud zu aktivieren. Du behältst volle Kontrolle über das Projekt, der Edge-Function-Code bleibt im Repo.

## Schritt 1 – Build Secrets im Lovable Workspace setzen
Du legst zwei Build-Time Env-Variablen an (das kann nur du, ich habe darauf keinen Zugriff):

1. Im Editor oben links: **Avatar / Workspace-Name → Workspace Settings**
2. Tab **Build Secrets** (NICHT „Secrets" im Projekt – das sind Runtime-Secrets für Edge Functions, die brauchen wir hier nicht)
3. Zwei Secrets hinzufügen, exakt diese Namen:
   - `VITE_SUPABASE_URL` = `https://bbdnnohujyvickhegbuf.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZG5ub2h1anl2aWNraGVnYnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTYwMDUsImV4cCI6MjA5NTI5MjAwNX0.TnxGmMWkKcwLBiAM831u68qbJcby2RCHbt_ZHv0t_so`
4. Speichern → Sandbox neu starten (passiert meist automatisch beim nächsten Build)

## Schritt 2 – Edge Function `fetch-live-scores` manuell deployen
Da kein Lovable-Cloud-Auto-Deploy läuft, musst du sie selbst hochladen:

**Variante A (am einfachsten – Dashboard Copy/Paste):**
1. https://supabase.com/dashboard/project/bbdnnohujyvickhegbuf/functions
2. **Create a new function** → Name: `fetch-live-scores`
3. Den kompletten Inhalt aus `supabase/functions/fetch-live-scores/index.ts` (existiert bereits im Repo) reinkopieren
4. **Deploy**

**Variante B (Supabase CLI, falls installiert):**
```
supabase link --project-ref bbdnnohujyvickhegbuf
supabase functions deploy fetch-live-scores
```

## Schritt 3 – API-Football-Key in Supabase setzen
1. https://supabase.com/dashboard/project/bbdnnohujyvickhegbuf/settings/functions
2. **Edge Function Secrets → Add new secret**
   - Name: `API_FOOTBALL_KEY`
   - Value: dein api-football.com Key
3. Speichern

## Schritt 4 – Verifizierung (mache ich nach deinem Go)
Sobald du sagst „fertig" prüfe ich:
- Sind `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` im Build sichtbar?
- Lädt die App ohne SSR-Crash?
- Antwortet die Edge Function auf `supabase.functions.invoke('fetch-live-scores')`?

Wenn etwas hakt, debugge ich gezielt.

## Was ich NICHT ändere
- Keine Code-Änderungen nötig – `src/integrations/supabase/client.ts` liest die Env-Vars schon korrekt.
- Keine Hardcoded-Keys im Repo (wichtig für späteren iOS-Deploy).
- Der Developer-Simulator-Toggle in Profil bleibt unverändert.

## Reihenfolge-Empfehlung
Schritt 1 zuerst (App lädt dann wieder ohne Crash, auch ohne API-Key). Dann 2 + 3 in beliebiger Reihenfolge. Live-Daten kommen erst beim Turnierstart bzw. wenn die API-Football-Liga aktiv ist – bis dahin kannst du den Simulator-Toggle nutzen.