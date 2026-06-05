export type AccentThemeId = "pitch" | "dfb" | "red" | "azzurri" | "canarinho";

export type AccentTheme = {
  id: AccentThemeId;
  label: string;
  swatch: string; // CSS color for the picker button
  vars: {
    primary: string;
    primaryForeground: string;
    ring: string;
  };
};

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: "pitch",
    label: "Pitch Green",
    swatch: "oklch(0.74 0.19 150)",
    vars: {
      primary: "oklch(0.74 0.19 150)",
      primaryForeground: "oklch(0.15 0.02 250)",
      ring: "oklch(0.74 0.19 150)",
    },
  },
  {
    id: "dfb",
    label: "DFB-Style",
    swatch: "oklch(0.80 0.15 85)",
    vars: {
      primary: "oklch(0.80 0.15 85)",
      primaryForeground: "oklch(0.15 0.02 250)",
      ring: "oklch(0.80 0.15 85)",
    },
  },
  {
    id: "red",
    label: "Classic Red",
    swatch: "oklch(0.62 0.24 27)",
    vars: {
      primary: "oklch(0.62 0.24 27)",
      primaryForeground: "oklch(0.99 0 0)",
      ring: "oklch(0.62 0.24 27)",
    },
  },
  {
    id: "azzurri",
    label: "Azzurri",
    swatch: "oklch(0.55 0.20 255)",
    vars: {
      primary: "oklch(0.55 0.20 255)",
      primaryForeground: "oklch(0.99 0 0)",
      ring: "oklch(0.55 0.20 255)",
    },
  },
  {
    id: "canarinho",
    label: "Canarinho",
    swatch: "oklch(0.88 0.19 100)",
    vars: {
      primary: "oklch(0.88 0.19 100)",
      primaryForeground: "oklch(0.15 0.02 250)",
      ring: "oklch(0.88 0.19 100)",
    },
  },
];

export function applyAccentTheme(id: AccentThemeId) {
  if (typeof document === "undefined") return;
  const theme = ACCENT_THEMES.find((t) => t.id === id) ?? ACCENT_THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.vars.primary);
  root.style.setProperty("--primary-foreground", theme.vars.primaryForeground);
  root.style.setProperty("--ring", theme.vars.ring);
  root.style.setProperty("--accent-color", theme.vars.primary);
}
