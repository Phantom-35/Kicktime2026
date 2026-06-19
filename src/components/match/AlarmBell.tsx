import { useState } from "react";
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
import { PushPermissionModal } from "./PushPermissionModal";
import type { Match } from "@/data/matches";

export function AlarmBell({ match }: { match: Match }) {
  const alarms = useAppStore((s) => s.alarms);
  const autoFav = useAppStore((s) => s.autoAlarmFavorites);
  const favorites = useAppStore((s) => s.favoriteTeams);
  const pushEnabled = useAppStore((s) => s.pushEnabled);
  const setAlarm = useAppStore((s) => s.setAlarm);
  const setPushEnabled = useAppStore((s) => s.setPushEnabled);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Wenn der globale Push-Schalter aus ist, sind ALLE Glocken visuell inaktiv.
  const active = pushEnabled && isAlarmActive(match, alarms, autoFav, favorites);
  const isAuto =
    alarms[match.id] === undefined && isAutoFavoriteMatch(match, autoFav, favorites);

  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pushEnabled) {
      haptics.tap();
      toast("Push-Benachrichtigungen sind deaktiviert", {
        description: "Aktiviere sie zuerst in den Einstellungen unter „Profil“.",
      });
      return;
    }
    if (active) {
      setAlarm(match.id, isAuto ? false : null);
      haptics.tap();
      toast(`Erinnerung für ${a.name} vs. ${b.name} deaktiviert`);
      removeMatchAlarm(match.id).catch(() => undefined);
      return;
    }

    let support = detectPushSupport();
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

    // Bei "default" einmalig Permission anfragen
    if (support === "default" && typeof Notification !== "undefined") {
      try {
        const res = await Notification.requestPermission();
        support = res as typeof support;
      } catch {
        support = "denied";
      }
    }

    // Wenn weiterhin nicht granted → Modal zeigen, NICHT abonnieren
    if (support !== "granted") {
      haptics.tap();
      setShowPermissionModal(true);
      return;
    }

    // UI sofort umschalten
    setAlarm(match.id, true);
    haptics.success();
    toast.success(`Erinnerung für ${a.name} vs. ${b.name} aktiviert! 🔔`);

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
      await addMatchAlarm(match.id, match.utcTimestamp, a.name, b.name);
      setPushEnabled(true);
    } catch (err) {
      console.warn("[AlarmBell] push setup failed", err);
      toast.error("Konnte Push-Erinnerung nicht registrieren");
    }
  };

  return (
    <>
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
      <PushPermissionModal
        open={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </>
  );
}
