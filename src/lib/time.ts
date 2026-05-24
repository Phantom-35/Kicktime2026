import type { Window } from "@/store/app-store";

export function getLocalParts(utc: string, tz: string) {
  const date = new Date(utc);
  const fmt = new Intl.DateTimeFormat("de-DE", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  // Day of week 0=Sun..6=Sat in target tz
  const dowFmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dowMap[dowFmt.format(date)] ?? 0;
  return {
    date,
    dow,
    isWeekend: dow === 5 || dow === 6 || dow === 0, // Fri night through Sun
    hour,
    minute,
    timeStr: `${parts.hour}:${parts.minute}`,
    dayStr: `${parts.weekday}, ${parts.day}.${parts.month}.`,
    fullStr: `${parts.weekday}, ${parts.day}.${parts.month}. · ${parts.hour}:${parts.minute}`,
  };
}

export function timeInWindow(hour: number, minute: number, w: Window) {
  const t = hour + minute / 60;
  if (w.end >= w.start) {
    return t >= w.start && t <= w.end;
  }
  // cross-midnight: e.g. 12 -> 4
  return t >= w.start || t <= w.end;
}

export function matchInAvailability(
  utc: string,
  tz: string,
  availability: { weekday: Window; weekend: Window }
) {
  const { isWeekend, hour, minute } = getLocalParts(utc, tz);
  const w = isWeekend ? availability.weekend : availability.weekday;
  return timeInWindow(hour, minute, w);
}

export function formatHourLabel(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
