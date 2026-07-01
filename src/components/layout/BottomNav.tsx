import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Settings as SettingsIcon, ListOrdered, Trophy, Flag } from "lucide-react";
// Gastro-Tab vorübergehend deaktiviert — Code bleibt für schnelle Reaktivierung erhalten.
// import { MapPin } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/spiele", label: "Spiele", icon: CalendarDays },
  { to: "/tabellen", label: "Tabellen", icon: ListOrdered },
  { to: "/turnier", label: "Status", icon: Flag },
  { to: "/tipps", label: "Tipps", icon: Trophy },
  // { to: "/bars", label: "Gastro", icon: MapPin }, // ← später wieder einblenden
  { to: "/profil", label: "Profil", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="md:hidden sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-2"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <ul className="grid grid-cols-6 h-16">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="h-full">
              <Link
                to={to}
                className="relative flex h-full w-full flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
                )}
                <Icon
                  className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

