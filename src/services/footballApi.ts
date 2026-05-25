/**
 * ============================================================================
 *  API-Football integration (https://www.api-football.com/)
 * ============================================================================
 *
 *  This service layer fetches LIVE scores / minutes / status for the FIFA
 *  World Cup 2026 and merges them into our local match store. We do NOT
 *  overwrite kickoff times, cities, broadcasters or the schedule — only
 *  the live runtime fields.
 *
 *  ── PLUG IN A REAL KEY ─────────────────────────────────────────────────
 *  1. Sign up at https://www.api-football.com/ and copy your API key.
 *  2. In Lovable: Project Settings → Environment Variables → add
 *
 *        VITE_API_FOOTBALL_KEY=<your-key>
 *
 *  3. Redeploy / refresh the preview. That's it.
 *
 *  ── ENDPOINT ──────────────────────────────────────────────────────────
 *  Live fixtures:  GET https://v3.football.api-sports.io/fixtures?live=all
 *  WC 2026 season: GET https://v3.football.api-sports.io/fixtures?league=1&season=2026
 *  Auth header:    x-apisports-key: <VITE_API_FOOTBALL_KEY>
 *
 *  NOTE on CORS: api-football.com supports browser requests for the
 *  rapidapi.com hosted variant, but the *.api-sports.io endpoint may
 *  require a server proxy depending on plan tier. If CORS blocks the
 *  call in production, move the fetch into a TanStack server function
 *  and keep the key as a server-side secret.
 * ============================================================================
 */

import { useMatchStore } from "@/store/match-store";
import { MATCHES } from "@/data/matches";
import { getTeam } from "@/data/teams";

const API_BASE = "https://v3.football.api-sports.io";
const API_KEY = (import.meta.env.VITE_API_FOOTBALL_KEY as string | undefined) ?? "";

export type LiveFixture = {
  teamA: string; // team code, e.g. "GER"
  teamB: string;
  status: "scheduled" | "live" | "finished";
  liveScore?: { a: number; b: number };
  matchMinute?: number;
};

export function hasApiKey(): boolean {
  return API_KEY.length > 0;
}

/**
 * Fetch live World Cup fixtures. Falls back to an empty list (no-op merge)
 * when no API key is configured so the app keeps running on local data.
 */
export async function fetchLiveWorldCupData(): Promise<LiveFixture[]> {
  if (!hasApiKey()) {
    // Single clean log so devs know why nothing's coming through.
    if (typeof window !== "undefined") {
      console.info(
        "[footballApi] VITE_API_FOOTBALL_KEY missing — using local fixture schedule."
      );
    }
    return [];
  }
  try {
    const res = await fetch(`${API_BASE}/fixtures?live=all`, {
      headers: { "x-apisports-key": API_KEY },
    });
    if (!res.ok) {
      console.warn("[footballApi] non-OK response", res.status);
      return [];
    }
    const json = (await res.json()) as ApiFootballResponse;
    return normalize(json);
  } catch (err) {
    console.warn("[footballApi] fetch failed", err);
    return [];
  }
}

type ApiFootballResponse = {
  response?: Array<{
    fixture?: { status?: { short?: string; elapsed?: number | null } };
    teams?: { home?: { name?: string }; away?: { name?: string } };
    goals?: { home?: number | null; away?: number | null };
  }>;
};

function normalize(json: ApiFootballResponse): LiveFixture[] {
  const out: LiveFixture[] = [];
  for (const r of json.response ?? []) {
    const homeName = r.teams?.home?.name;
    const awayName = r.teams?.away?.name;
    if (!homeName || !awayName) continue;
    const teamA = nameToCode(homeName);
    const teamB = nameToCode(awayName);
    if (!teamA || !teamB) continue;
    const shortStatus = r.fixture?.status?.short ?? "NS";
    const status: LiveFixture["status"] = mapStatus(shortStatus);
    out.push({
      teamA,
      teamB,
      status,
      liveScore:
        r.goals?.home != null && r.goals?.away != null
          ? { a: r.goals.home, b: r.goals.away }
          : undefined,
      matchMinute: r.fixture?.status?.elapsed ?? undefined,
    });
  }
  return out;
}

function mapStatus(s: string): LiveFixture["status"] {
  if (["NS", "TBD", "PST"].includes(s)) return "scheduled";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(s)) return "finished";
  return "live"; // 1H, HT, 2H, ET, BT, P, LIVE
}

/** German display name → team code lookup. Cached. */
let nameIndex: Record<string, string> | null = null;
function nameToCode(name: string): string | null {
  if (!nameIndex) {
    nameIndex = {};
    // Match by both German display name and English-ish canonical names.
    // We compare lowercased to be tolerant of casing differences.
    for (const t of (await import("@/data/teams")).TEAMS ?? []) {
      // placeholder — replaced at runtime below
      nameIndex[t.name.toLowerCase()] = t.code;
    }
  }
  return nameIndex[name.toLowerCase()] ?? null;
}

/**
 * Merge a list of live fixtures into the match store. We pair by team-code
 * pair (order-insensitive) against our hand-curated MATCHES schedule.
 */
export function applyLiveFixturesToStore(fixtures: LiveFixture[]): void {
  if (fixtures.length === 0) return;
  const apply = useMatchStore.getState().applyLiveUpdate;
  for (const f of fixtures) {
    const match = MATCHES.find(
      (m) =>
        (m.teamA === f.teamA && m.teamB === f.teamB) ||
        (m.teamA === f.teamB && m.teamB === f.teamA)
    );
    if (!match) continue;
    const flipped = match.teamA !== f.teamA;
    const liveScore =
      f.liveScore && flipped
        ? { a: f.liveScore.b, b: f.liveScore.a }
        : f.liveScore;
    apply(match.id, {
      status: f.status,
      liveScore,
      matchMinute: f.matchMinute,
    });
  }
}

// Avoid the `await import` inside a sync function (TS would reject).
// Build name index synchronously from the already-imported TEAMS modules.
import { TEAMS } from "@/data/teams";
nameIndex = (() => {
  const out: Record<string, string> = {};
  for (const t of TEAMS) out[t.name.toLowerCase()] = t.code;
  return out;
})();

// Re-export for tests/devtools.
export { getTeam };
