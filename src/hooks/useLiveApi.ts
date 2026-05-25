import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import {
  applyLiveFixturesToStore,
  fetchLiveWorldCupData,
  isLiveDataEnabled,
} from "@/services/footballApi";


/**
 * Polls API-Football for live fixture updates and merges them into the
 * match store. Disabled when the developer simulator is on, or when no
 * API key is configured.
 */
export function useLiveApi(intervalMs = 30_000): void {
  const simulating = useAppStore((s) => s.devSimulateLive);

  useEffect(() => {
    if (simulating || !isLiveDataEnabled()) return;

    let cancelled = false;
    const run = async () => {
      const fixtures = await fetchLiveWorldCupData();
      if (cancelled) return;
      applyLiveFixturesToStore(fixtures);
    };
    run();
    const id = window.setInterval(run, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [simulating, intervalMs]);
}
