# Update v6.3.0

## 1. Version

- `src/lib/version.ts`: `APP_VERSION = "6.3.0"`
- `package.json` `version` auf `6.3.0`

## 2. TV-Sender Override (Hardcode-Mapping)

### Ansatz
Eigenes Mapping-Modul, das die JSON-Werte überschreibt — **kein** Bearbeiten der großen `world_cup_2026_schedule.json`. So bleibt die Datenquelle clean und das Mapping ist an einer Stelle pflegbar.

Neue Datei `src/lib/tv-overrides.ts`:
- Map nach Spielpaarung (Team-Code Tupel, reihenfolgenunabhängig) → `{ broadcaster, broadcasters[] }`.
- Helper `applyTvOverride(match)` setzt `broadcaster` (primärer Sender für Anzeige) + `broadcasters[]` (vollständige Liste).
- K.O.-Logik: für `stage !== "group"`:
  - Finale (m.stage === "final") → `["ZDF"]`
  - Sonst mit GER-Beteiligung → `["ARD", "ZDF"]`
  - Sonst Default → `["ARD", "ZDF"]` (Free-TV-Standard).
- `broadcaster` (Primärwert) wird aus `broadcasters[]` abgeleitet: ARD bevorzugt → sonst ZDF → sonst MagentaTV.

### Hardcoded Gruppenphasen-Mapping
| Paarung | broadcasters |
|---|---|
| MEX–RSA | ["ZDF"] |
| KOR–CZE | ["ARD","ZDF"] (Zusammenfassung) |
| CAN–BIH | ["ARD"] |
| QAT–SUI | ["ZDF"] |
| BRA–MAR | ["ZDF"] |
| HAI–SCO | ["ARD"] |
| GER–CUW | ["ARD"] |
| FRA–SEN | ["MagentaTV"] |
| CZE–RSA | ["ARD","ZDF"] |
| MEX–KOR | ["ARD","ZDF"] |
| GER–CIV | ["ZDF"] |
| ECU–CUW | ["ARD","ZDF"] |
| CZE–MEX | ["ARD","ZDF"] |
| RSA–KOR | ["ARD","ZDF"] |
| ECU–GER | ["ARD"] |
| CUW–CIV | ["MagentaTV"] |

Alle anderen Gruppenspiele bleiben unverändert (aus JSON).

### Integration
- `src/store/match-store.ts`: in `seed()` jeden Match durch `applyTvOverride()` schicken, bevor er ins Store geschrieben wird.
- Damit greift das Override automatisch in `MatchCard`, `MatchDetailSheet`, allen Filtern, `broadcaster.ts`-Helpern etc. — keine weiteren Stellen betroffen.

## 3. Feedback-Abfrage (alle 15 App-Öffnungen)

### Counter
- `src/lib/open-counter.ts`: 
  - `incrementOpenCount()` → liest `localStorage["kicktime.openCount"]`, +1, schreibt zurück, gibt neue Zahl zurück.
  - `shouldShowFeedback()` → true wenn `count % 15 === 0` UND `localStorage["kicktime.feedback.lastShownCount"] !== count`.
  - `markFeedbackShown(count)` setzt `lastShownCount`.
- Trigger einmalig im Mount von `src/routes/__root.tsx` oder `src/routes/index.tsx` (analog WhatsNew-Trigger).

### UI
- Neue Komponente `src/components/feedback/FeedbackModal.tsx`:
  - `Dialog` mit Frage „Wie gefällt dir KickTime 2026?"
  - 3 große Buttons: 👍 / 😐 / 👎
  - onClick: `submitFeedback(rating)` → schließt sofort, kein Danke-Screen.
- Eingebunden in `src/routes/index.tsx` neben `WhatsNewModal`.

### Datenspeicher
- Supabase-Tabelle `app_feedback`:
  ```
  id uuid PK default gen_random_uuid()
  device_id text not null
  rating smallint not null check (rating in (-1, 0, 1))
  app_version text
  created_at timestamptz default now()
  ```
- Insert mit `device_id` aus `src/lib/device-id.ts` (existiert bereits).
- Helper `src/lib/feedback.ts`: `submitFeedback(rating)` → supabase insert + telemetry/console log.

### RLS
- `enable row level security`
- Policy `insert` `to anon, authenticated` `with check (true)` (Insert-only)
- Kein public select — Admin-Auswertung läuft via **separater Aggregat-RPC** (s.u.), damit niemand die Roh-Tabelle lesen kann.

### Admin-Aggregation
- Postgres-Funktion `public.get_feedback_summary()` returns table `(rating smallint, count bigint)` — `security definer`, grant execute an authenticated.
- `src/components/admin/AdminPanel.tsx`: neuer Tab `💬 Feedback`:
  - `supabase.rpc("get_feedback_summary")` aufrufen
  - Drei Zähler-Kacheln: 👍 / 😐 / 👎 inkl. Prozent-Bar.

## 4. WhatsNewModal v6.3.0

`src/components/whats-new/WhatsNewModal.tsx`:
- Version-Badge auf `v6.3.0`
- Zwei neue Features oben in der Liste:
  - 📺 **TV-Sender-Updates** — Feste ARD/ZDF/MagentaTV-Zuordnung für Gruppen- und K.O.-Phase.
  - 💬 **Dein Feedback zählt** — Optionale Blitz-Abfrage zur Zufriedenheit.
- `WhatsNewModal` wird wegen Versions-Bump automatisch ein Mal angezeigt (Logik existiert).

## 5. Geänderte / neue Dateien

**Neu:**
- `src/lib/tv-overrides.ts`
- `src/lib/open-counter.ts`
- `src/lib/feedback.ts`
- `src/components/feedback/FeedbackModal.tsx`

**Bearbeitet:**
- `src/lib/version.ts`, `package.json`
- `src/store/match-store.ts` (seed → applyTvOverride)
- `src/routes/index.tsx` (Mount FeedbackModal + Counter-Trigger)
- `src/components/whats-new/WhatsNewModal.tsx`
- `src/components/admin/AdminPanel.tsx` (Feedback-Tab)

## 6. Manuelle Supabase-Schritte (am Ende der Implementation als Copy-Paste)

Du bekommst nach dem Build einen Block mit:

1. **Tabelle anlegen** — SQL für `create table public.app_feedback ...` + GRANTs + RLS + Insert-Policy.
2. **Aggregat-Funktion** — `create function public.get_feedback_summary()` + `grant execute`.
3. **Verifikation** — kurzer SELECT-Snippet zum Testen.

Keine Edge Function nötig. Keine pg_cron-Änderungen. Keine neuen Secrets.
