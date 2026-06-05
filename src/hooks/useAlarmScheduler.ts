import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getTeam } from "@/data/teams";
import { detectPushSupport, scheduleLocalNotification } from "@/lib/notifications";
import { isAlarmActive } from "@/lib/alarms";

/**
 * Re-schedules all armed match reminders on every app load and whenever the
 * user's alarm set or the live schedule changes. Honors both manual bell
 * toggles and the "auto-activate for favorites" preference.
 */
export function useAlarmScheduler(): void {
  const alarms = useAppStore((s) => s.alarms);
  const autoFav = useAppStore((s) => s.autoAlarmFavorites);
  const favorites = useAppStore((s) => s.favoriteTeams);
  const matches = useMatchStore(selectMatchList);
  const pushEnabled = useAppStore((s) => s.pushEnabled);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pushEnabled) return;
    const support = detectPushSupport();
    if (support !== "granted") return;

    const cancellers: Array<() => void> = [];
    const lead = 15 * 60 * 1000;
    for (const m of matches) {
      if (!isAlarmActive(m, alarms, autoFav, favorites)) continue;
      const kickoff = new Date(m.utcTimestamp).getTime();
      const whenMs = kickoff - lead;
      if (whenMs <= Date.now()) continue;
      const a = getTeam(m.teamA).name;
      const b = getTeam(m.teamB).name;
      cancellers.push(
        scheduleLocalNotification(
          whenMs,
          `🏆 KickTime Erinnerung`,
          `In 15 Minuten startet ${a} gegen ${b}! Schalte rechtzeitig ein.`
        )
      );
    }
    return () => {
      for (const c of cancellers) c();
    };
  }, [alarms, autoFav, favorites, matches, pushEnabled]);
}
