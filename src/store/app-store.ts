import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentThemeId } from "@/lib/accent-themes";

export type Window = { start: number; end: number }; // hours 0-24, end may be < start (cross-midnight)

type State = {
  userTimezone: string;
  favoriteTeams: string[];
  interestingTeams: string[];
  availability: { weekday: Window; weekend: Window };
  spoilerProtection: boolean;
  isOnboarded: boolean;
  alarms: Record<string, boolean>;
  theme: "dark" | "light";
  pushEnabled: boolean;
  autoAlarmFavorites: boolean;
  devSimulateLive: boolean;
  showCountdown: boolean;
  accentTheme: AccentThemeId;
  predictions: Record<string, { a: number; b: number; createdAt: number }>;
  lastSeenVersion: string;
  revealedMatches: Record<string, true>;
  // --- Admin / System Monitoring (nicht im WhatsNew erwähnt) ---
  adminKoPhaseOverride: number | null; // 5..9 oder null (=Auto)
  activeKoPhase: number | null;        // zuletzt genutzte KO-Phase (nur Anzeige)
  activeApiUrl: string | null;         // zuletzt abgefragte URL (nur Anzeige)
  lastApiFetchAt: number | null;
  apiErrorLog: Array<{ ts: number; url: string; message: string; phase: number | null }>;
};


type Actions = {
  setTimezone: (tz: string) => void;
  toggleFavorite: (code: string) => void;
  toggleInteresting: (code: string) => void;
  setAvailability: (a: State["availability"]) => void;
  setSpoiler: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  toggleAlarm: (id: string) => void;
  setAlarm: (id: string, v: boolean | null) => void;
  resetOnboarding: () => void;
  setTheme: (t: "dark" | "light") => void;
  setPushEnabled: (v: boolean) => void;
  setAutoAlarmFavorites: (v: boolean) => void;
  setDevSimulateLive: (v: boolean) => void;
  setShowCountdown: (v: boolean) => void;
  setAccentTheme: (id: AccentThemeId) => void;
  setPrediction: (matchId: string, a: number, b: number) => void;
  clearPrediction: (matchId: string) => void;
  setLastSeenVersion: (v: string) => void;
  revealMatch: (id: string) => void;
  // Admin / System
  setAdminKoPhaseOverride: (n: number | null) => void;
  setActiveApiState: (phase: number | null, url: string | null) => void;
  logApiError: (url: string, message: string, phase: number | null) => void;
  clearApiErrorLog: () => void;
};


const detectTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
  } catch {
    return "Europe/Berlin";
  }
};

export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      userTimezone: detectTz(),
      favoriteTeams: [],
      interestingTeams: [],
      availability: {
        weekday: { start: 18, end: 23.5 },
        weekend: { start: 12, end: 4 },
      },
      spoilerProtection: true,
      isOnboarded: false,
      alarms: {},
      theme: "dark",
      pushEnabled: false,
      autoAlarmFavorites: true,
      devSimulateLive: false,
      showCountdown: true,
      accentTheme: "pitch",
      predictions: {},
      lastSeenVersion: "",
      revealedMatches: {},
      adminKoPhaseOverride: null,
      activeKoPhase: null,
      activeApiUrl: null,
      lastApiFetchAt: null,
      apiErrorLog: [],





      setTimezone: (tz) => set({ userTimezone: tz }),
      toggleFavorite: (code) =>
        set((s) => {
          const isFav = s.favoriteTeams.includes(code);
          if (isFav) {
            return { favoriteTeams: s.favoriteTeams.filter((c) => c !== code) };
          }
          return {
            favoriteTeams: [...s.favoriteTeams, code],
            interestingTeams: s.interestingTeams.filter((c) => c !== code),
          };
        }),
      toggleInteresting: (code) =>
        set((s) => {
          const isInt = s.interestingTeams.includes(code);
          if (isInt) {
            return { interestingTeams: s.interestingTeams.filter((c) => c !== code) };
          }
          return {
            interestingTeams: [...s.interestingTeams, code],
            favoriteTeams: s.favoriteTeams.filter((c) => c !== code),
          };
        }),
      setAvailability: (a) => set({ availability: a }),
      setSpoiler: (v) => set({ spoilerProtection: v }),
      setOnboarded: (v) => set({ isOnboarded: v }),
      toggleAlarm: (id) =>
        set((s) => ({ alarms: { ...s.alarms, [id]: !s.alarms[id] } })),
      setAlarm: (id, v) =>
        set((s) => {
          const next = { ...s.alarms };
          if (v === null) delete next[id];
          else next[id] = v;
          return { alarms: next };
        }),
      resetOnboarding: () =>
        set({
          isOnboarded: false,
          favoriteTeams: [],
          interestingTeams: [],
          alarms: {},
        }),
      setTheme: (t) => set({ theme: t }),
      setPushEnabled: (v) =>
        set((s) => (v ? { pushEnabled: true } : { pushEnabled: false, alarms: {}, autoAlarmFavorites: false })),
      setAutoAlarmFavorites: (v) => set({ autoAlarmFavorites: v }),
      setDevSimulateLive: (v) => set({ devSimulateLive: v }),
      setShowCountdown: (v) => set({ showCountdown: v }),
      setAccentTheme: (id) => set({ accentTheme: id }),
      setPrediction: (matchId, a, b) =>
        set((s) => ({
          predictions: {
            ...s.predictions,
            [matchId]: { a, b, createdAt: s.predictions[matchId]?.createdAt ?? Date.now() },
          },
        })),
      clearPrediction: (matchId) =>
        set((s) => {
          const next = { ...s.predictions };
          delete next[matchId];
          return { predictions: next };
        }),
      setLastSeenVersion: (v) => set({ lastSeenVersion: v }),
      revealMatch: (id) =>
        set((s) => (s.revealedMatches[id] ? s : { revealedMatches: { ...s.revealedMatches, [id]: true } })),
      setAdminKoPhaseOverride: (n) => set({ adminKoPhaseOverride: n }),
      setActiveApiState: (phase, url) =>
        set({ activeKoPhase: phase, activeApiUrl: url, lastApiFetchAt: Date.now() }),
      logApiError: (url, message, phase) =>
        set((s) => ({
          apiErrorLog: [
            { ts: Date.now(), url, message: message.slice(0, 300), phase },
            ...s.apiErrorLog,
          ].slice(0, 30),
        })),
      clearApiErrorLog: () => set({ apiErrorLog: [] }),

    }),
    { name: "kicktime-2026" }
  )
);
