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
      setPushEnabled: (v) => set({ pushEnabled: v }),
      setAutoAlarmFavorites: (v) => set({ autoAlarmFavorites: v }),
      setDevSimulateLive: (v) => set({ devSimulateLive: v }),
      setShowCountdown: (v) => set({ showCountdown: v }),
    }),
    { name: "kicktime-2026" }
  )
);
