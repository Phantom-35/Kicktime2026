import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import {
  applyLiveFixturesToStore,
  fetchLiveWorldCupData,
  isLiveDataEnabled,
} from "@/services/footballApi";
import { fetchMatchOverrides, applyOverridesToStore } from "@/lib/match-overrides";

const IDLE_TTL_MS = 4 * 60 * 60 * 1000; // 4h
const LIVE_POLL_MS = 90_000; // 90s while live window is active
const LIVE_BUFFER_MS = 15 * 60 * 1000; // ±15min around kickoff/end
const LAST_IDLE_KEY = "kicktime-last-idle-fetch";

const MATCH_DURATION_MS = 115 * 60 * 1000;

/**
 * Adaptive poller. Manual admin overrides are applied AFTER upstream so they
 * always win against API data.
 */
export function useLiveApi(): void {
  const simulating = useAppStore((s) => s.devSimulateLive);
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);
  const intervalRef = useRef<number | null>(null);

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

    const applyOverrides = async () => {
      const overrides = await fetchMatchOverrides();
      if (cancelled) return;
      applyOverridesToStore(overrides);
    };

    const runIdle = async () => {
      try {
        const last = Number(localStorage.getItem(LAST_IDLE_KEY) ?? "0");
        if (Date.now() - last < IDLE_TTL_MS) {
          // still fetch overrides — admins may have manual updates
          await applyOverrides();
          return;
        }
        const fixtures = await fetchLiveWorldCupData("idle");
        if (cancelled) return;
        applyLiveFixturesToStore(fixtures);
        await applyOverrides();
        localStorage.setItem(LAST_IDLE_KEY, String(Date.now()));
      } catch {
        /* noop */
      }
    };

    const runLive = async () => {
      const fixtures = await fetchLiveWorldCupData("live");
      if (cancelled) return;
      applyLiveFixturesToStore(fixtures);
      await applyOverrides();
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
