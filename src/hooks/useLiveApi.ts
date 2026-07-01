import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { useMatchStore, selectMatchList } from "@/store/match-store";
import {
  applyLiveFixturesToStore,
  fetchLiveWorldCupData,
  isLiveDataEnabled,
} from "@/services/footballApi";
import { fetchMatchOverrides, applyOverridesToStore } from "@/lib/match-overrides";
import { determineActiveKoPhase, type KoPhaseNum } from "@/lib/ko-phase";

const IDLE_TTL_MS = 5 * 60 * 1000; // 5 min
const LIVE_POLL_MS = 5 * 60 * 1000; // 5 min — OpenLigaDB cadence
const LIVE_BUFFER_MS = 15 * 60 * 1000; // ±15min around kickoff/end
const LAST_IDLE_KEY = "kicktime-last-idle-fetch";
const MATCH_DURATION_MS = 115 * 60 * 1000;

/**
 * Adaptive poller. Manual admin overrides are applied AFTER upstream so they
 * always win against API data. Chooses the correct OpenLigaDB KO-phase URL
 * automatically and honours the admin override from the app store.
 */
export function useLiveApi(): void {
  const simulating = useAppStore((s) => s.devSimulateLive);
  const adminOverride = useAppStore((s) => s.adminKoPhaseOverride);
  const setActiveApiState = useAppStore((s) => s.setActiveApiState);
  const logApiError = useAppStore((s) => s.logApiError);
  const matches = useMatchStore(selectMatchList);
  const now = useMatchStore((s) => s.now);
  const intervalRef = useRef<number | null>(null);

  const inLiveWindow = matches.some((m) => {
    if (m.status === "live") return true;
    const kickoff = new Date(m.utcTimestamp).getTime();
    const ends = kickoff + MATCH_DURATION_MS;
    return now >= kickoff - LIVE_BUFFER_MS && now <= ends + LIVE_BUFFER_MS;
  });

  const koPhase: KoPhaseNum | null = useMemo(() => {
    if (adminOverride && [4, 5, 6, 7, 8, 9].includes(adminOverride)) {
      return adminOverride as KoPhaseNum;
    }
    return determineActiveKoPhase(matches);
  }, [adminOverride, matches]);

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

    const trackResult = (res: Awaited<ReturnType<typeof fetchLiveWorldCupData>>) => {
      setActiveApiState(res.koPhase, res.url);
      if (res.error) {
        logApiError(res.url ?? "unknown", res.error, res.koPhase);
      }
      // 12h-Regel: leeres Ergebnis nur als Fehler werten, wenn der letzte
      // Anpfiff dieser Phase mind. 12h zurückliegt — sonst normale Ruhezeit.
      if (!res.error && res.fixtures.length === 0 && res.koPhase != null) {
        const twelveH = 12 * 60 * 60 * 1000;
        const stageMap: Record<number, string> = { 4: "r32", 5: "r16", 6: "qf", 7: "sf", 8: "third", 9: "final" };
        const stage = stageMap[res.koPhase];
        const phaseMatches = matches.filter((m) => m.stage === stage);
        if (phaseMatches.length > 0) {
          const lastKickoff = Math.max(
            ...phaseMatches.map((m) => new Date(m.utcTimestamp).getTime()),
          );
          if (Date.now() - lastKickoff > twelveH) {
            logApiError(
              res.url ?? "unknown",
              "Leeres Array trotz >12h nach letztem Anpfiff der Phase",
              res.koPhase,
            );
          }
        }
      }
    };

    const runIdle = async () => {
      try {
        const last = Number(localStorage.getItem(LAST_IDLE_KEY) ?? "0");
        if (Date.now() - last < IDLE_TTL_MS) {
          await applyOverrides();
          return;
        }
        const res = await fetchLiveWorldCupData("idle", koPhase);
        if (cancelled) return;
        trackResult(res);
        applyLiveFixturesToStore(res.fixtures);
        await applyOverrides();
        localStorage.setItem(LAST_IDLE_KEY, String(Date.now()));
      } catch (err) {
        logApiError("network", err instanceof Error ? err.message : String(err), koPhase);
      }
    };

    const runLive = async () => {
      try {
        const res = await fetchLiveWorldCupData("live", koPhase);
        if (cancelled) return;
        trackResult(res);
        applyLiveFixturesToStore(res.fixtures);
        await applyOverrides();
      } catch (err) {
        logApiError("network", err instanceof Error ? err.message : String(err), koPhase);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulating, inLiveWindow, koPhase]);
}
