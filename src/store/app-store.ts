import { create } from "zustand";
import { persist } from "zustand/middleware";

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
};

type Actions = {
  setTimezone: (tz: string) => void;
  toggleFavorite: (code: string) => void;
  toggleInteresting: (code: string) => void;
  setAvailability: (a: State["availability"]) => void;
  setSpoiler: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  toggleAlarm: (id: string) => void;
  resetOnboarding: () => void;
  setTheme: (t: "dark" | "light") => void;
  setPushEnabled: (v: boolean) => void;
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
      resetOnboarding: () =>
        set({
          isOnboarded: false,
          favoriteTeams: [],
          interestingTeams: [],
          alarms: {},
        }),
    }),
    { name: "kicktime-2026" }
  )
);
