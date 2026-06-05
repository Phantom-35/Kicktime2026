import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { getTeam } from "@/data/teams";
import { isAlarmActive, isAutoFavoriteMatch } from "@/lib/alarms";
import type { Match } from "@/data/matches";

export function AlarmBell({ match }: { match: Match }) {
  const alarms = useAppStore((s) => s.alarms);
  const autoFav = useAppStore((s) => s.autoAlarmFavorites);
  const favorites = useAppStore((s) => s.favoriteTeams);
  const pushEnabled = useAppStore((s) => s.pushEnabled);
  const setAlarm = useAppStore((s) => s.setAlarm);

  const active = isAlarmActive(match, alarms, autoFav, favorites);
  const isAuto =
    alarms[match.id] === undefined && isAutoFavoriteMatch(match, autoFav, favorites);

  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (active) {
      // Turn OFF: if auto, set explicit false; else clear to undefined
      setAlarm(match.id, isAuto ? false : null);
      toast(`Erinnerung für ${a.name} vs. ${b.name} deaktiviert`);
    } else {
      setAlarm(match.id, true);
      toast.success(`Erinnerung für ${a.name} vs. ${b.name} aktiviert! 🔔`);
      if (!pushEnabled) {
        toast("Aktiviere Push-Benachrichtigungen im Profil", {
          description: "Sonst kann die Erinnerung nicht aufploppen.",
        });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Erinnerung deaktivieren" : "Erinnerung aktivieren"}
      aria-pressed={active}
      className={`shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-lg border transition-colors active:scale-95 ${
        active
          ? "bg-primary/15 border-primary text-primary"
          : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      <Bell className={`h-3.5 w-3.5 ${active ? "fill-current" : ""}`} />
    </button>
  );
}
