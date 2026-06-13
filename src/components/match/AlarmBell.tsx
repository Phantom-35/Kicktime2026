import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { getTeam } from "@/data/teams";
import { isAlarmActive, isAutoFavoriteMatch } from "@/lib/alarms";
import { haptics } from "@/lib/haptics";
import { detectPushSupport } from "@/lib/notifications";
import { subscribeForPush } from "@/lib/push-client";
import { hasVapidPublicKey } from "@/lib/push-config";
import {
  addMatchAlarm,
  removeMatchAlarm,
  upsertPushSubscription,
} from "@/lib/push-subscriptions";
import type { Match } from "@/data/matches";

export function AlarmBell({ match }: { match: Match }) {
  const alarms = useAppStore((s) => s.alarms);
  const autoFav = useAppStore((s) => s.autoAlarmFavorites);
  const favorites = useAppStore((s) => s.favoriteTeams);
  const setAlarm = useAppStore((s) => s.setAlarm);
  const setPushEnabled = useAppStore((s) => s.setPushEnabled);

  const active = isAlarmActive(match, alarms, autoFav, favorites);
  const isAuto =
    alarms[match.id] === undefined && isAutoFavoriteMatch(match, autoFav, favorites);

  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (active) {
      setAlarm(match.id, isAuto ? false : null);
      haptics.tap();
      toast(`Erinnerung für ${a.name} vs. ${b.name} deaktiviert`);
      // Best-effort Cleanup in DB — Fehler ignorieren
      removeMatchAlarm(match.id).catch(() => undefined);
      return;
    }

    const support = detectPushSupport();
    if (support === "ios-needs-pwa") {
      toast.error("Für iPhone-Benachrichtigungen App zum Home-Bildschirm hinzufügen", {
        description:
          "Safari → Teilen → 'Zum Home-Bildschirm'. Sonst kann iOS keine Push-Erinnerungen senden.",
        duration: 7000,
      });
      return;
    }
    if (support === "unsupported") {
      toast.error("Push wird in diesem Browser nicht unterstützt");
      return;
    }

    // 1) UI sofort umschalten — der DB-Roundtrip läuft im Hintergrund
    setAlarm(match.id, true);
    haptics.success();
    toast.success(`Erinnerung für ${a.name} vs. ${b.name} aktiviert! 🔔`);

    // 2) Push-Abo registrieren + in Supabase persistieren
    if (!hasVapidPublicKey()) {
      toast("Push-Server noch nicht konfiguriert", {
        description: "Admin muss VAPID-Keys hinterlegen. Lokale Erinnerung läuft trotzdem.",
      });
      return;
    }
    try {
      const sub = await subscribeForPush();
      if (!sub) {
        toast("Benachrichtigungen blockiert", {
          description: "Erlaube Push in den Browser-Einstellungen.",
        });
        return;
      }
      await upsertPushSubscription(sub);
      await addMatchAlarm(match.id, match.utcTimestamp);
      setPushEnabled(true);
    } catch (err) {
      console.warn("[AlarmBell] push setup failed", err);
      toast.error("Konnte Push-Erinnerung nicht registrieren");
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
