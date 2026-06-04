## Ziel

Moderne Splash-Animation (3 s) beim echten App-Cold-Start, mit Logo, pulsierender grüner Aura, KickTime/2026-Text, feinem Ladebalken am unteren Rand. Danach smoother Slide-Up + Fade-In der Haupt-App. Wiederholtes Anzeigen wird per `sessionStorage` verhindert.

## Änderungen

### 1. Logo als Asset einbinden
- `IMG_2028.jpeg` (hochgeladen) via `lovable-assets create` nach `src/assets/splash-logo.jpeg.asset.json` hochladen.
- Nur als Pointer-JSON im Repo, kein Binary committen.

### 2. Neue Komponente `src/components/splash/SplashScreen.tsx`
- Fullscreen-Overlay (`fixed inset-0 z-[100]`) mit App-Hintergrund (`bg-background`).
- Aufbau (zentriert via Flex):
  - **Aura**: absolut positionierter Kreis hinter dem Logo, `bg-primary/30` mit starkem `blur-3xl`, `animate-pulse` (langsam, ~2 s) – nutzt die bestehende Stadion-Grün-Primärfarbe aus `src/styles.css`.
  - **Logo**: `<img>` aus dem Asset-Pointer, ca. 160 px, leichter `drop-shadow` in Primärfarbe, dezente `scale-in`-Einblendung.
  - **Text**: "KickTime" (groß, `font-bold`, `tracking-[0.3em]`), darunter "2026" (kleiner, `tracking-[0.5em]`, `text-muted-foreground`).
  - **Ladebalken**: am unteren Rand (`absolute bottom-12`), 1 px hoch, 60 % Breite, `bg-primary/20`-Track + Inner-Bar, die per Framer-Motion in 3 s von 0 % auf 100 % wächst (ease-out für „organisches" Auffüllen).
- State: `visible` (Overlay sichtbar) + `fadingOut` (Opacity 0 + leichter Scale ab ~2.7 s) – nach 3 s `onDone()` Callback.
- AnimatePresence steuert das saubere Ausblenden (Opacity-Fade, 300 ms).

### 3. Einbindung in `src/routes/__root.tsx`
- Lokaler State `showSplash` in `RootComponent`:
  ```
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("splash_shown") !== "1";
  });
  ```
- Beim Unmount/Done: `sessionStorage.setItem("splash_shown", "1")` + `setShowSplash(false)`.
- Layout-Wrapper bekommt parallel eine Motion-Einblende-Animation:
  - Wenn `showSplash` true: Haupt-Layout wird mit `opacity: 0, y: 24` vorgerendert (oder erst nach Splash-Ende per AnimatePresence eingeblendet).
  - Sobald Splash fertig: `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}` (Slide-Up + Fade).
- SSR-Sicherheit: `useEffect`-Guard, damit kein Hydration-Mismatch entsteht (initial `showSplash = false`, dann im Effect auf true setzen, falls Session-Flag fehlt). Splash rendert also clientseitig nach Mount.

### 4. Verhalten / Logik
- **Cold Start** (App neu geöffnet, Tab geschlossen gewesen) → `sessionStorage` leer → Splash erscheint.
- **Tab-Wechsel / Minimierung** (PWA bleibt im Speicher) → `sessionStorage` bleibt erhalten → kein Splash.
- **Route-Wechsel innerhalb der App** → State bleibt `false`, kein erneuter Splash.

### 5. Versions-Bump
- `APP_VERSION` in `src/routes/profil.tsx` von `"3.2.2"` → `"3.2.3"`.

## Technische Details

- Animationen via bereits vorhandenes `framer-motion` (kommt schon im Projekt vor).
- Farben strikt aus Design-Tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`) – keine Hardcoded-Hex.
- Aura-Pulse: zwei übereinandergelegte Kreise mit unterschiedlichem Blur und versetzter `animate-pulse`-Verzögerung für weicheren Glow.
- Ladebalken: `motion.div` mit `initial={{ width: 0 }}`, `animate={{ width: "100%" }}`, `transition={{ duration: 3, ease: "easeOut" }}`.
- Splash-Komponente ist client-only (rendert `null` auf Server / vor `useEffect`-Mount), um SSR-Probleme zu vermeiden.

## Hinweise

- Da die App ein SPA mit clientseitigem Routing ist, ist „App komplett geschlossen" exakt der `sessionStorage`-Lifecycle – passt zur Anforderung.
- Bei installierten PWAs auf iOS/Android verhält sich `sessionStorage` identisch: er wird gelöscht, sobald die App aus dem App-Switcher gewischt wird, bleibt aber bei reinem Minimieren erhalten.
