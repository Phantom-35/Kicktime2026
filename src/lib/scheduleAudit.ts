/**
 * Dev-mode self-test for the static FIFA WM 2026 schedule and live-merge path.
 * Runs once on app load in development. No-op in production builds.
 */
import scheduleJson from "@/data/world_cup_2026_schedule.json";
import { useMatchStore } from "@/store/match-store";

type RawMatch = {
  id: string;
  stage: string;
  group?: string;
  teamA: string;
  teamB: string;
  utcTimestamp: string;
  stadium?: string;
  city?: string;
  hostCountry?: string;
  broadcaster?: string;
  broadcasters?: string[];
};

const FREE_TV: Record<string, string[]> = {
  "m-001": ["ARD"], // Opener MEX vs RSA — at least one of ARD/ZDF
  "m-010": ["ARD", "ZDF"], // GER vs CUW
  "m-033": ["ARD", "ZDF"], // GER vs CIV
  "m-056": ["ARD", "ZDF"], // ECU vs GER
};

const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function runScheduleAudit(): void {
  const all = scheduleJson as RawMatch[];
  const group = all.filter((m) => m.stage === "group");
  const errors: string[] = [];

  // 1. Completeness — ids m-001..m-072
  const ids = new Set(group.map((m) => m.id));
  for (let i = 1; i <= 72; i++) {
    const id = `m-${String(i).padStart(3, "0")}`;
    if (!ids.has(id)) errors.push(`Missing match ${id}`);
  }
  if (group.length !== 72) errors.push(`Expected 72 group matches, got ${group.length}`);

  // 2. Schema + ISO-8601 + TV
  for (const m of group) {
    const required: Array<keyof RawMatch> = [
      "id", "group", "teamA", "teamB", "utcTimestamp", "stadium", "city", "hostCountry",
    ];
    for (const k of required) {
      if (!m[k]) errors.push(`${m.id}: missing field "${String(k)}"`);
    }
    if (!ISO_Z.test(m.utcTimestamp)) {
      errors.push(`${m.id}: utcTimestamp "${m.utcTimestamp}" is not ISO-8601 Z`);
    } else if (Number.isNaN(new Date(m.utcTimestamp).getTime())) {
      errors.push(`${m.id}: utcTimestamp does not parse via new Date()`);
    }
    const tv = m.broadcasters ?? (m.broadcaster ? [m.broadcaster] : []);
    if (!tv.includes("MagentaTV")) errors.push(`${m.id}: MagentaTV missing in broadcasters`);

    const expectedFree = FREE_TV[m.id];
    if (expectedFree && !expectedFree.some((b) => tv.includes(b))) {
      errors.push(`${m.id}: expected one of ${expectedFree.join("/")} in broadcasters, got [${tv.join(", ")}]`);
    }
  }

  // 3. Live-merge simulation — apply mock update, read back, then reset
  const store = useMatchStore.getState();
  const beforeStatus = store.matches["m-001"]?.status;
  store.applyLiveUpdate("m-001", {
    status: "live",
    liveScore: { a: 1, b: 0 },
    matchMinute: 42,
  });
  const after = useMatchStore.getState().matches["m-001"];
  if (after?.status !== "live" || after.liveScore?.a !== 1 || after.matchMinute !== 42) {
    errors.push(`Live-merge failed for m-001 (status=${after?.status}, score=${JSON.stringify(after?.liveScore)}, min=${after?.matchMinute})`);
  }
  useMatchStore.getState().resetMatches();
  if (useMatchStore.getState().matches["m-001"]?.status !== beforeStatus) {
    // not fatal, but flag if reset didn't restore
    errors.push(`resetMatches() did not restore m-001 to baseline status`);
  }

  // 4. Report
  const css = "padding:2px 6px;border-radius:4px;font-weight:bold;color:white;";
  if (errors.length === 0) {
    console.log(
      `%c✅ SCHEDULE AUDIT SUCCESS%c 72/72 group matches valid · ISO-8601 ✓ · MagentaTV ✓ · Free-TV ✓ · Live-merge ✓`,
      `${css}background:#16a34a;`,
      "color:inherit;"
    );
  } else {
    console.group(
      `%c❌ SCHEDULE AUDIT ERROR%c ${errors.length} issue(s)`,
      `${css}background:#dc2626;`,
      "color:inherit;"
    );
    for (const e of errors) console.error(e);
    console.groupEnd();
  }
}
