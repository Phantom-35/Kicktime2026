import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore } from "@/store/match-store";

/**
 * Developer-only simulator. When the user enables "Entwickler-Modus:
 * Live-Daten simulieren", we pick whichever match is closest to *now*
 * and tick its score / minute every few seconds so the Dashboard and
 * Tabellen visibly react. No-op when the toggle is off.
 */
export function useLiveSimulation(intervalMs = 8_000): void {
  const enabled = useAppStore((s) => s.devSimulateLive);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const store = useMatchStore.getState();
      const now = Date.now();
      const list = Object.values(store.matches);

      // Prefer an existing live match.
      let target = list.find((m) => m.status === "live");

      // Otherwise force-start the upcoming match closest to now.
      if (!target) {
        const upcoming = list
          .filter((m) => m.status !== "finished")
          .sort(
            (a, b) =>
              Math.abs(new Date(a.utcTimestamp).getTime() - now) -
              Math.abs(new Date(b.utcTimestamp).getTime() - now)
          );
        target = upcoming[0];
        if (!target) return;
        store.applyLiveUpdate(target.id, {
          status: "live",
          liveScore: { a: 0, b: 0 },
          matchMinute: 1,
        });
        return;
      }

      const cur = target.liveScore ?? { a: 0, b: 0 };
      const side: "a" | "b" = Math.random() < 0.5 ? "a" : "b";
      const scored = Math.random() < 0.5;
      const nextMinute = Math.min(90, (target.matchMinute ?? 1) + 3);
      store.applyLiveUpdate(target.id, {
        liveScore: scored ? { ...cur, [side]: cur[side] + 1 } : cur,
        matchMinute: nextMinute,
      });
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
}
