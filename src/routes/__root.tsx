import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  useLocation,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStore } from "@/store/app-store";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useLiveSimulation } from "@/hooks/useLiveSimulation";
import { useLiveApi } from "@/hooks/useLiveApi";
import { runScheduleAudit } from "@/lib/scheduleAudit";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">Diese Seite gibt es nicht.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "KickTime 2026 – Dein WM-Planer" },
      { name: "description", content: "Plane die FIFA WM 2026 nach deiner Zeitzone, deinen Teams und deinen freien Abenden." },
      { name: "theme-color", content: "#0b1018" },
      { property: "og:title", content: "KickTime 2026 – Dein WM-Planer" },
      { name: "twitter:title", content: "KickTime 2026 – Dein WM-Planer" },
      { property: "og:description", content: "Plane die FIFA WM 2026 nach deiner Zeitzone, deinen Teams und deinen freien Abenden." },
      { name: "twitter:description", content: "Plane die FIFA WM 2026 nach deiner Zeitzone, deinen Teams und deinen freien Abenden." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b438d25e-187f-4763-b160-d2e99afcb23d/id-preview-3bd2a940--6cd1ce8d-c0ff-41f3-bb07-9ae3121f6cc7.lovable.app-1779643162848.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b438d25e-187f-4763-b160-d2e99afcb23d/id-preview-3bd2a940--6cd1ce8d-c0ff-41f3-bb07-9ae3121f6cc7.lovable.app-1779643162848.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: "/app-icon.jpeg" },
      { rel: "apple-touch-icon", href: "/app-icon.jpeg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const mainRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const [showSpieleTop, setShowSpieleTop] = useState(false);
  const onboarded = useAppStore((s) => s.isOnboarded);
  const theme = useAppStore((s) => s.theme);
  useThemeClass(theme);
  useLiveClock();
  useLiveSimulation();
  useLiveApi();
  useEffect(() => {
    if (import.meta.env.DEV) runScheduleAudit();
  }, []);
  useEffect(() => {
    if (location.pathname !== "/spiele") {
      setShowSpieleTop(false);
      return;
    }
    const main = mainRef.current;
    const onScroll = () => setShowSpieleTop(Math.max(main?.scrollTop ?? 0, window.scrollY) > 24);
    onScroll();
    main?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      main?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [location.pathname]);
  const scrollSpieleToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full flex justify-center bg-background">
        <div className="relative w-full max-w-md min-h-screen flex flex-col bg-background shadow-2xl md:my-4 md:rounded-3xl md:overflow-hidden md:min-h-[calc(100vh-2rem)] md:border md:border-border">
          <AppHeader />
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            {onboarded ? <Outlet /> : <OnboardingFlow />}
          </main>
          {onboarded && showSpieleTop && (
            <button
              type="button"
              onClick={scrollSpieleToTop}
              aria-label="Nach oben"
              className="absolute bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-2 ring-background active:scale-90 transition-transform"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          )}
          {onboarded && <BottomNav />}
        </div>
      </div>
      <Toaster theme={theme} position="top-center" richColors />
    </QueryClientProvider>
  );
}

function useThemeClass(theme: "dark" | "light") {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);
}
