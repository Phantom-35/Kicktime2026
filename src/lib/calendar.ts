import type { Match } from "@/data/matches";
import { getTeam } from "@/data/teams";

/** Format a JS Date as iCalendar UTC: YYYYMMDDTHHMMSSZ */
function toIcsUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Builds a `.ics` file for the given match and triggers a download.
 * On iOS Safari and Android Chrome the file is opened directly by the
 * system calendar app, prefilled with the match date/time and location.
 */
export function addMatchToCalendar(match: Match): void {
  const a = getTeam(match.teamA);
  const b = getTeam(match.teamB);

  const start = new Date(match.utcTimestamp);
  // 90 min play + 15 min half-time buffer
  const end = new Date(start.getTime() + 105 * 60 * 1000);

  const broadcasters = (match.broadcasters ?? [match.broadcaster]).join(" & ");
  const summary = `${a.flag} ${a.name} vs ${b.name} ${b.flag} (Gruppe ${match.group})`;
  const description = `FIFA WM 2026 · Gruppenphase\\nÜbertragung: ${broadcasters}\\nStadion: ${match.stadium}, ${match.city}`;
  const location = `${match.stadium}, ${match.city}`;
  const uid = `${match.id}@kicktime-2026`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KickTime 2026//WM-Planer//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs("Anpfiff in 15 Minuten: " + summary)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `wm2026-${match.id}.ics`;
  link.rel = "noopener";
  // Some iOS versions need the link in the DOM to honour the download attribute
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Slight delay so iOS has a chance to read the blob before revocation
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
