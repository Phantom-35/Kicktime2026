# Desktop-Layout für KickTime 2026

Ziel: Auf Bildschirmen ab `md` (≥768px) wird die App zu einem vollwertigen, breiten Desktop-Layout. Auf Smartphones (<768px) bleibt **alles 1:1 wie jetzt** — keine Klassen ohne `md:` / `lg:` Prefix werden verändert.

## 1. App-Shell (`src/routes/__root.tsx`)

Aktuell wird alles in eine `max-w-md`-Handy-Hülle gepresst. Stattdessen:

- Mobile: unverändert (`max-w-md`, BottomNav unten, AppHeader oben).
- Desktop (`md:`): 
  - Äußerer Container wird `max-w-[1400px]` und `lg:max-w-screen-2xl`, Karten-Hülle entfällt (`md:max-w-none md:rounded-none md:border-0 md:shadow-none md:my-0`).
  - Grid mit zwei Spalten: **linke Sidebar** (240px) mit Logo + Desktop-Navigation, **rechter Content** flexibel breit.
  - `BottomNav` wird auf Desktop versteckt (`md:hidden`).
  - Neue Komponente `SideNav` (nur `hidden md:flex`) mit denselben Tabs wie BottomNav, vertikal, inkl. KickTime-Logo + Spoiler-Schutz-Toggle oben.
  - `AppHeader` bleibt auf Mobile sichtbar, wird auf Desktop versteckt (`md:hidden`), weil Logo + Spoiler-Toggle in die SideNav wandern.
  - Scroll-to-top-Button-Positionierung wird für Desktop angepasst (rechts unten ohne Bottom-Nav-Offset).

## 2. Seiten-Layouts (jeweils nur `md:` Klassen hinzufügen)

- **`src/routes/index.tsx` (Dashboard):** Auf Desktop zweispaltiges Grid (`md:grid md:grid-cols-[1fr_360px] md:gap-6`) — Haupt-Content links, Sekundär-Widgets (z.B. Nächste Spiele / Quick-Stats) rechts als Sticky-Sidebar.
- **`src/routes/spiele.tsx`:** Spiel-Liste auf Desktop als Grid (`md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4`). Filter-Bar wird zur Sticky-Sidebar links (`md:grid md:grid-cols-[260px_1fr]`).
- **`src/routes/tabellen.tsx`:** Gruppen-Tabellen auf Desktop als 2- bzw. 3-Spalten-Grid (`md:grid-cols-2 lg:grid-cols-3`).
- **`src/routes/bars.tsx`:** Venue-Karten auf Desktop als Grid (`md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). Stadt-Dropdown bleibt oben, volle Breite begrenzt.
- **`src/routes/profil.tsx`:** Einstellungs-Karten auf Desktop als Masonry-artiges 2-Spalten-Grid (`md:grid md:grid-cols-2 md:gap-5`), Danger-Zone + Version bleiben full-width.
- **`OnboardingFlow`:** Auf Desktop zentrierter Karten-Container mit `md:max-w-2xl`, sonst unverändert.

Alle Anpassungen sind **additive Tailwind-Utility-Klassen mit `md:` / `lg:` / `xl:` Prefix**. Bestehende Mobile-Klassen werden nicht entfernt.

## 3. Padding & Spacing

- Außen-Padding auf Desktop großzügiger: `md:px-8 lg:px-12 md:py-8`.
- Karten-Innenabstand auf Desktop leicht erhöht wo sinnvoll (`md:p-6`).

## 4. Version

`APP_VERSION` in `src/routes/profil.tsx` von `"2.0.7"` → `"3.0.0"`.

## Technische Details

- Keine neuen Dependencies.
- Neue Datei: `src/components/layout/SideNav.tsx` (analog zu `BottomNav.tsx`, aber vertikal + Logo + Spoiler-Switch).
- `BottomNav` bekommt `className="md:hidden"` am Wrapper.
- `AppHeader` bekommt `className="md:hidden"` am Wrapper.
- Shell-Wrapper-Klassen werden umgeschrieben, sodass Mobile-Resultat byte-identisch bleibt (alle alten Klassen bleiben, neue `md:`-Overrides kommen dazu).
- Breakpoint-Grenze: `md` (768px). Alles darunter = aktuelles Mobile-Design.

## Out of Scope

- Keine Änderung an Business-Logik, Daten, Stores, Auth, Edge Functions.
- Keine neuen Farben/Tokens — bestehende `src/styles.css` Tokens werden weiterverwendet.
- Keine Änderungen an Match-Card-Innenleben — nur Grid-Anordnung außen herum.
