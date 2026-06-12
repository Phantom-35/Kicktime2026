/**
 * Supabase Edge Function: fetch-live-scores
 *
 * - OpenLigaDB Upstream (frei, ohne Key): /getmatchdata/wm/2026
 * - 5-Minuten-Cache in `live_fixtures_cache`
 * - Manuelle Admin-Overrides aus `match_overrides` gewinnen IMMER gegen Upstream
 * - Vollständige CORS-Header auf ALLEN Responses (Preflight, Success, Error)
 */

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Max-Age": "86400",
};

const CACHE_ID = "world-cup-2026";
const LIVE_TTL_MS = 5 * 60_000;
const IDLE_TTL_MS = 5 * 60_000;
const UPSTREAM_URL = "https://api.openligadb.de/getmatchdata/wm/2026";
const MATCH_WINDOW_MS = 130 * 60 * 1000;

type Override = {
  match_id: string;
  score_a: number;
  score_b: number;
  minute: number | null;
  status: "scheduled" | "live" | "finished";
  is_manual: boolean;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    let mode: "live" | "idle" = "live";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.mode === "idle") mode = "idle";
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) {
      return json({ error: "Service not configured", fixtures: [] }, 500);
    }

    const admin = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    const overrides = await loadOverrides(admin);

    const ttl = mode === "live" ? LIVE_TTL_MS : IDLE_TTL_MS;
    let cached: { payload: any; fetched_at: string } | null = null;
    if (admin) {
      const { data } = await admin
        .from("live_fixtures_cache")
        .select("payload, fetched_at")
        .eq("id", CACHE_ID)
        .maybeSingle();
      cached = (data as any) ?? null;
    }

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < ttl) {
        const merged = mergeOverrides(cached.payload?.response ?? [], overrides);
        return json({ fixtures: merged, cache: "hit" }, 200);
      }
    }

    try {
      const upstream = await fetch(UPSTREAM_URL, {
        headers: { accept: "application/json" },
      });
      if (!upstream.ok) {
        if (cached) {
          const merged = mergeOverrides(cached.payload?.response ?? [], overrides);
          return json({ fixtures: merged, cache: "stale" }, 200);
        }
        return json({ fixtures: overridesOnly(overrides), cache: "overrides" }, 200);
      }

      const raw = await upstream.json();
      const response = Array.isArray(raw)
        ? raw.map(mapOpenLigaMatch).filter(Boolean)
        : [];
      const payload = { response };

      if (admin) {
        await admin.from("live_fixtures_cache").upsert({
          id: CACHE_ID,
          payload,
          fetched_at: new Date().toISOString(),
        });
      }

      const merged = mergeOverrides(response, overrides);
      return json({ fixtures: merged, cache: "miss" }, 200);
    } catch (err) {
      console.error("[fetch-live-scores] upstream error:", err);
      if (cached) {
        const merged = mergeOverrides(cached.payload?.response ?? [], overrides);
        return json({ fixtures: merged, cache: "stale" }, 200);
      }
      return json({ fixtures: overridesOnly(overrides), cache: "overrides" }, 200);
    }
  } catch (err) {
    console.error("[fetch-live-scores] fatal:", err);
    return json({ error: "Internal error", fixtures: [] }, 500);
  }
});

async function loadOverrides(admin: any): Promise<Override[]> {
  if (!admin) return [];
  try {
    const { data, error } = await admin
      .from("match_overrides")
      .select("match_id, score_a, score_b, minute, status, is_manual");
    if (error) {
      console.warn("[fetch-live-scores] overrides select failed:", error.message);
      return [];
    }
    return (data ?? []) as Override[];
  } catch (err) {
    console.warn("[fetch-live-scores] overrides threw:", err);
    return [];
  }
}

function mergeOverrides(fixtures: any[], overrides: Override[]): any[] {
  if (overrides.length === 0) return fixtures;
  const byId = new Map<string, any>();
  for (const f of fixtures) {
    const id = String(f?.fixture?.id ?? "");
    if (id) byId.set(id, f);
  }
  for (const o of overrides) {
    if (!o.is_manual) continue;
    const id = String(o.match_id);
    const existing = byId.get(id);
    const statusShort =
      o.status === "finished" ? "FT" : o.status === "live" ? "1H" : "NS";
    if (existing) {
      existing.goals = { home: o.score_a, away: o.score_b };
      existing.fixture = {
        ...existing.fixture,
        status: {
          short: statusShort,
          elapsed: o.minute ?? existing.fixture?.status?.elapsed ?? null,
        },
      };
    } else {
      byId.set(id, {
        fixture: {
          id,
          date: undefined,
          status: { short: statusShort, elapsed: o.minute ?? null },
          venue: { name: null, city: null },
        },
        teams: { home: { name: null }, away: { name: null } },
        goals: { home: o.score_a, away: o.score_b },
      });
    }
  }
  return [...byId.values()];
}

function overridesOnly(overrides: Override[]): any[] {
  return mergeOverrides([], overrides);
}

function mapOpenLigaMatch(m: any): any | null {
  if (!m || !m.team1 || !m.team2) return null;
  const dateIso = m.matchDateTimeUTC
    ? new Date(m.matchDateTimeUTC).toISOString()
    : undefined;
  const kickoff = dateIso ? new Date(dateIso).getTime() : NaN;
  const now = Date.now();

  let statusShort = "NS";
  if (m.matchIsFinished) {
    statusShort = "FT";
  } else if (!Number.isNaN(kickoff)) {
    if (now >= kickoff && now <= kickoff + MATCH_WINDOW_MS) statusShort = "1H";
  }

  let goalsHome: number | null = null;
  let goalsAway: number | null = null;
  if (Array.isArray(m.matchResults) && m.matchResults.length > 0) {
    const ordered = [...m.matchResults].sort(
      (a, b) => (b?.resultOrderID ?? 0) - (a?.resultOrderID ?? 0),
    );
    const final = ordered[0];
    if (final && typeof final.pointsTeam1 === "number") {
      goalsHome = final.pointsTeam1;
      goalsAway = final.pointsTeam2;
    }
  }
  if ((goalsHome == null || goalsAway == null) && Array.isArray(m.goals) && m.goals.length > 0) {
    const lastGoal = [...m.goals].sort(
      (a, b) => (b?.matchMinute ?? 0) - (a?.matchMinute ?? 0),
    )[0];
    if (lastGoal) {
      goalsHome = lastGoal.scoreTeam1 ?? 0;
      goalsAway = lastGoal.scoreTeam2 ?? 0;
    }
  }
  if (statusShort === "1H" && goalsHome == null) {
    goalsHome = 0;
    goalsAway = 0;
  }

  let elapsed: number | null = null;
  if (statusShort === "1H" && !Number.isNaN(kickoff)) {
    const raw = Math.floor((now - kickoff) / 60_000);
    let mm = Math.min(120, Math.max(1, raw));
    if (mm > 45 && mm < 60) mm = 45;
    elapsed = mm;
  }

  return {
    fixture: {
      id: m.matchID,
      date: dateIso,
      status: { short: statusShort, elapsed },
      venue: {
        name: m.location?.locationStadium ?? null,
        city: m.location?.locationCity ?? null,
      },
    },
    teams: {
      home: { name: m.team1?.teamName ?? m.team1?.shortName ?? null },
      away: { name: m.team2?.teamName ?? m.team2?.shortName ?? null },
    },
    goals: { home: goalsHome, away: goalsAway },
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
