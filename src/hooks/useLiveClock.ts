import { useEffect } from "react";
import { useMatchStore } from "@/store/match-store";

/**
 * Drives the rolling-schedule engine. Every 10 seconds we re-sync match
 * statuses against the real system clock so finished matches drop out of
 * the dashboard automatically and upcoming ones slide in.
 */
export function useLiveClock(intervalMs = 10_000): void {
  useEffect(() => {
    const sync = useMatchStore.getState().syncWithRealTime;
    sync();
    const id = window.setInterval(sync, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}
