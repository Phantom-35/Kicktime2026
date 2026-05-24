import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStore } from "@/store/app-store";

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
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
  const onboarded = useAppStore((s) => s.isOnboarded);
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full flex justify-center bg-background">
        <div className="relative w-full max-w-md min-h-screen flex flex-col bg-background shadow-2xl md:my-4 md:rounded-3xl md:overflow-hidden md:min-h-[calc(100vh-2rem)] md:border md:border-border">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            {onboarded ? <Outlet /> : <OnboardingFlow />}
          </main>
          {onboarded && <BottomNav />}
        </div>
      </div>
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}
