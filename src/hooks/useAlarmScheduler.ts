import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import { getTeam } from "@/data/teams";
import { detectPushSupport, scheduleLocalNotification } from "@/lib/notifications";

/**
 * Re-schedules all armed match reminders on every app load and whenever the
 * user's alarm set or the live schedule changes. Notifications fire 15
 * minutes before kickoff via `setTimeout` from the service worker registration
 * scope if available, falling back to in-tab notifications.
 *
 * Mobile compatibility:
 *  - Android Chrome (tab open or as PWA): works.
 *  - Desktop browsers with granted permission: works.
 *  - iOS Safari: only works when the app is installed as PWA (iOS 16.4+).
 *    We surface that requirement in the Profil tab — here we simply skip.
 */
export function useAlarmScheduler(): void {
  const alarms = useAppStore((s) => s.alarms);
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
      if (!alarms[m.id]) continue;
      const kickoff = new Date(m.utcTimestamp).getTime();
      const whenMs = kickoff - lead;
      if (whenMs <= Date.now()) continue;
      const a = getTeam(m.teamA).name;
      const b = getTeam(m.teamB).name;
      cancellers.push(
        scheduleLocalNotification(
          whenMs,
          `⚽ ${a} vs. ${b}`,
          `Anpfiff in 15 Minuten – ${m.broadcaster}.`
        )
      );
    }
    return () => {
      for (const c of cancellers) c();
    };
  }, [alarms, matches, pushEnabled]);
}
