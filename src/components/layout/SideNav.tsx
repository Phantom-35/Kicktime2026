import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  MapPin,
  Settings as SettingsIcon,
  ListOrdered,
  Eye,
  EyeOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";

const tabs = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/spiele", label: "Spiele", icon: CalendarDays },
  { to: "/tabellen", label: "Tabellen", icon: ListOrdered },
  { to: "/bars", label: "Gastro", icon: MapPin },
  { to: "/profil", label: "Profil", icon: SettingsIcon },
] as const;

export function SideNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const spoiler = useAppStore((s) => s.spoilerProtection);
  const setSpoiler = useAppStore((s) => s.setSpoiler);

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 sticky top-0 h-screen border-r border-border bg-card/80 backdrop-blur px-4 py-6 gap-6">
      <div className="flex items-center gap-2 px-2">
        <img src="/logo.png" alt="KickTime" className="h-9 w-9 rounded-lg object-cover" />
        <h1 className="text-lg font-bold tracking-tight">
          Kick<span className="text-primary">Time</span>{" "}
          <span className="text-muted-foreground text-sm">2026</span>
        </h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <label className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 cursor-pointer">
        <span className="flex items-center gap-2 text-xs font-medium">
          {spoiler ? (
            <EyeOff className="h-4 w-4 text-accent" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          Spoiler-Schutz
        </span>
        <Switch checked={spoiler} onCheckedChange={setSpoiler} className="data-[state=unchecked]:bg-destructive" />
      </label>
    </aside>
  );
}
