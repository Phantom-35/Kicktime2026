import type { Window } from "@/store/app-store";

/**
 * Format a UTC ISO timestamp using the browser's native timezone.
 * The `_tz` argument is kept for backwards compatibility but is intentionally
 * ignored — we delegate all timezone & DST handling to the user's
 * Intl/OS settings (toLocaleString without a timeZone option).
 */
export function getLocalParts(utc: string, _tz?: string) {
  const date = new Date(utc);

  const fmt = new Intl.DateTimeFormat("de-DE", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);

  // Day-of-week in user's locale (0=Sun..6=Sat)
  const dow = date.getDay();

  return {
    date,
    dow,
    isWeekend: dow === 5 || dow === 6 || dow === 0,
    hour,
    minute,
    timeStr: `${parts.hour}:${parts.minute}`,
    dayStr: `${parts.weekday}, ${parts.day}.${parts.month}.`,
    fullStr: `${parts.weekday}, ${parts.day}.${parts.month}. · ${parts.hour}:${parts.minute}`,
    /** Stable key (YYYY-MM-DD) representing the local calendar date — use for grouping. */
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function timeInWindow(hour: number, minute: number, w: Window) {
  const t = hour + minute / 60;
  if (w.end >= w.start) {
    return t >= w.start && t <= w.end;
  }
  return t >= w.start || t <= w.end;
}

export function matchInAvailability(
  utc: string,
  _tz: string | undefined,
  availability: { weekday: Window; weekend: Window }
) {
  const { isWeekend, hour, minute } = getLocalParts(utc);
  const w = isWeekend ? availability.weekend : availability.weekday;
  return timeInWindow(hour, minute, w);
}

export function formatHourLabel(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
