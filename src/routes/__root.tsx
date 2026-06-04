import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/splash/SplashScreen";
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
import { SideNav } from "@/components/layout/SideNav";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStore } from "@/store/app-store";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useLiveSimulation } from "@/hooks/useLiveSimulation";
import { useLiveApi } from "@/hooks/useLiveApi";
import { useAlarmScheduler } from "@/hooks/useAlarmScheduler";
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
      { title: "KickTime 2026" },
      { name: "description", content: "Plane die FIFA WM 2026 nach deiner Zeitzone, deinen Teams und deinen freien Abenden." },
      { name: "theme-color", content: "#0b1018" },
      { property: "og:title", content: "KickTime 2026" },
      { name: "twitter:title", content: "KickTime 2026" },
      { property: "og:description", content: "Plane die FIFA WM 2026 nach deiner Zeitzone, deinen Teams und deinen freien Abenden." },
      { name: "twitter:description", content: "Plane die FIFA WM 2026 nach deiner Zeitzone, deinen Teams und deinen freien Abenden." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a8cf072a-fd02-4e05-b180-3bd76243d478" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a8cf072a-fd02-4e05-b180-3bd76243d478" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/jpeg", href: "/app-icon.jpeg?v=2.0.6" },
      { rel: "apple-touch-icon", href: "/app-icon.jpeg?v=2.0.6" },
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
  const [showSplash, setShowSplash] = useState(false);
  const [appReady, setAppReady] = useState(true);
  const onboarded = useAppStore((s) => s.isOnboarded);
  const theme = useAppStore((s) => s.theme);
  useThemeClass(theme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("splash_shown") !== "1") {
        setShowSplash(true);
        setAppReady(false);
      }
    } catch {
      // sessionStorage unavailable — skip splash
    }
  }, []);

  const handleSplashDone = () => {
    try {
      sessionStorage.setItem("splash_shown", "1");
    } catch {
      // ignore
    }
    setShowSplash(false);
    setAppReady(true);
  };
  useLiveClock();
  useLiveSimulation();
  useLiveApi();
  useAlarmScheduler();
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
      <div className="min-h-screen w-full flex justify-center bg-background md:justify-start">
        {onboarded && <SideNav />}
        <div className="relative w-full max-w-md min-h-screen flex flex-col bg-background shadow-2xl md:my-0 md:max-w-none md:rounded-none md:border-0 md:shadow-none md:min-h-screen md:flex-1 md:overflow-visible">
          <AppHeader />
          <main ref={mainRef} className="flex-1 overflow-y-auto md:overflow-visible">
            <div className="md:max-w-[1400px] xl:max-w-screen-2xl md:mx-auto md:w-full md:px-8 lg:px-12 md:py-6">
              {onboarded ? <Outlet /> : <OnboardingFlow />}
            </div>
          </main>
          {onboarded && showSpieleTop && (
            <button
              type="button"
              onClick={scrollSpieleToTop}
              aria-label="Nach oben"
              className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-[max(1rem,calc((100vw-28rem)/2+1rem))] md:bottom-8 md:right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-2 ring-background active:scale-90 transition-transform"
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
