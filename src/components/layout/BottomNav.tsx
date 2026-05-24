import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, MapPin, Settings as SettingsIcon } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/spiele", label: "Alle Spiele", icon: CalendarDays },
  { to: "/bars", label: "Gastro", icon: MapPin },
  { to: "/profil", label: "Profil", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 active:scale-95 transition-transform"
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
