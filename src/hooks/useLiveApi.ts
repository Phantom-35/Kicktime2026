import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import {
  applyLiveFixturesToStore,
  fetchLiveWorldCupData,
  isLiveDataEnabled,
} from "@/services/footballApi";

const IDLE_TTL_MS = 4 * 60 * 60 * 1000; // 4h
const LIVE_POLL_MS = 90_000; // 90s while live window is active
const LIVE_BUFFER_MS = 15 * 60 * 1000; // ±15min around kickoff/end
const LAST_IDLE_KEY = "kicktime-last-idle-fetch";

const MATCH_DURATION_MS = 115 * 60 * 1000;

/**
 * Adaptive poller:
 *  - Live window (a match is live OR kickoff within ±15 min OR ended <15 min ago):
 *    polls every 90s with mode "live" (60s server-side cache).
 *  - Otherwise: at most one "idle" fetch per 4 hours (cached server-side too).
 */
export function useLiveApi(): void {
  const simulating = useAppStore((s) => s.devSimulateLive);
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);
  const intervalRef = useRef<number | null>(null);

  // Compute whether we're in a "live window".
  const inLiveWindow = matches.some((m) => {
    if (m.status === "live") return true;
    const kickoff = new Date(m.utcTimestamp).getTime();
    const ends = kickoff + MATCH_DURATION_MS;
    return now >= kickoff - LIVE_BUFFER_MS && now <= ends + LIVE_BUFFER_MS;
  });

  useEffect(() => {
    if (simulating || !isLiveDataEnabled()) return;

    let cancelled = false;
    const clearTimer = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const runIdle = async () => {
      try {
        const last = Number(localStorage.getItem(LAST_IDLE_KEY) ?? "0");
        if (Date.now() - last < IDLE_TTL_MS) return;
        const fixtures = await fetchLiveWorldCupData("idle");
        if (cancelled) return;
        applyLiveFixturesToStore(fixtures);
        localStorage.setItem(LAST_IDLE_KEY, String(Date.now()));
      } catch {
        /* noop */
      }
    };

    const runLive = async () => {
      const fixtures = await fetchLiveWorldCupData("live");
      if (cancelled) return;
      applyLiveFixturesToStore(fixtures);
    };

    if (inLiveWindow) {
      runLive();
      intervalRef.current = window.setInterval(runLive, LIVE_POLL_MS);
    } else {
      runIdle();
    }

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [simulating, inLiveWindow]);
}
