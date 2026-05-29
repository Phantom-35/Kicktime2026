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

const MONTHS_DE: Record<string, number> = {
  januar: 1, jan: 1,
  februar: 2, feb: 2,
  märz: 3, marz: 3, maerz: 3, mar: 3, mär: 3,
  april: 4, apr: 4,
  mai: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oct: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12, dec: 12,
};

/**
 * Best-effort parse of a free-text date query into a partial date filter.
 * Returns null if nothing date-like is recognized. Year 2026 is assumed by default.
 *
 * Recognizes: "14.06", "14.06.2026", "14/6", "2026-06-14", "14. Juni",
 * "14 juni 2026", "Juni", "Juni 14".
 */
export function parseDateQuery(q: string): { year?: number; month?: number; day?: number } | null {
  const s = q.trim().toLowerCase();
  if (!s) return null;

  // ISO: 2026-06-14 or 2026-6-14
  let m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (m) return { year: +m[1], month: +m[2], day: m[3] ? +m[3] : undefined };

  // 14.06.2026 / 14.06 / 14/6/2026 / 14/6
  m = s.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (m) {
    const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : undefined;
    return { day: +m[1], month: +m[2], year };
  }

  // "Juni", "Juni 14", "14. Juni", "14 juni 2026"
  const tokens = s.replace(/[.,]/g, " ").split(/\s+/).filter(Boolean);
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;
  for (const t of tokens) {
    if (MONTHS_DE[t] !== undefined) month = MONTHS_DE[t];
    else if (/^\d{4}$/.test(t)) year = +t;
    else if (/^\d{1,2}$/.test(t)) {
      const n = +t;
      if (!day && n >= 1 && n <= 31) day = n;
    }
  }
  if (month || day || year) return { day, month, year };
  return null;
}

/**
 * Test whether a UTC ISO timestamp matches a parsed date query.
 * Year/month/day fields in the query are all optional; missing fields are wildcards.
 */
export function matchesDateQuery(utc: string, q: { year?: number; month?: number; day?: number }): boolean {
  const parts = getLocalParts(utc);
  const [y, m, d] = parts.dayKey.split("-").map((n) => parseInt(n, 10));
  if (q.year !== undefined && q.year !== y) return false;
  if (q.month !== undefined && q.month !== m) return false;
  if (q.day !== undefined && q.day !== d) return false;
  return true;
}
