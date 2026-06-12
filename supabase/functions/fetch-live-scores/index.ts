/**
 * Supabase Edge Function: fetch-live-scores
 *
 * Now backed by OpenLigaDB (free, no key required).
 *   Upstream: https://api.openligadb.de/getmatchdata/wm/2026
 *
 * Translates OpenLigaDB's match objects into the legacy `RawFixture` shape
 * the app already consumes, so `services/footballApi.ts` keeps working.
 *
 * Caching via `live_fixtures_cache`:
 *   - mode === "live"  → 60s
 *   - mode === "idle"  → 4h
 */

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CACHE_ID = "world-cup-2026";
const LIVE_TTL_MS = 60_000;
const IDLE_TTL_MS = 4 * 60 * 60 * 1000;
const UPSTREAM_URL = "https://api.openligadb.de/getmatchdata/wm/2026";
const MATCH_WINDOW_MS = 130 * 60 * 1000;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let mode: "live" | "idle" = "live";
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.mode === "idle") mode = "idle";
    }
  } catch {
    /* default */
  }

  // --- AuthN -----------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized", fixtures: [] }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[fetch-live-scores] supabase env vars missing");
    return json({ error: "Service temporarily unavailable.", fixtures: [] }, 500);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) return json({ error: "Unauthorized", fixtures: [] }, 401);
  } catch (err) {
    console.error("[fetch-live-scores] auth check failed:", err);
    return json({ error: "Unauthorized", fixtures: [] }, 401);
  }

  const admin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  // --- Cache lookup ----------------------------------------------------------
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
      console.log(`[fetch-live-scores] cache HIT (mode=${mode}, age=${Math.round(age / 1000)}s)`);
      return json({ fixtures: cached.payload?.response ?? [], cache: "hit" }, 200);
    }
  }

  // --- Upstream call (OpenLigaDB) -------------------------------------------
  try {
    const upstream = await fetch(UPSTREAM_URL, {
      headers: { accept: "application/json" },
    });

    if (!upstream.ok) {
      console.error("[fetch-live-scores] openligadb non-ok:", upstream.status);
      if (cached) {
        return json({ fixtures: cached.payload?.response ?? [], cache: "stale" }, 200);
      }
      return json({ error: "Upstream error", fixtures: [] }, 502);
    }

    const raw = await upstream.json();
    const response = Array.isArray(raw) ? raw.map(mapOpenLigaMatch).filter(Boolean) : [];
    const payload = { response };

    if (admin) {
      await admin
        .from("live_fixtures_cache")
        .upsert({
          id: CACHE_ID,
          payload,
          fetched_at: new Date().toISOString(),
        });
    }

    console.log(`[fetch-live-scores] cache MISS (mode=${mode}) — OpenLigaDB OK (${response.length} fixtures)`);
    return json({ fixtures: response, cache: "miss" }, 200);
  } catch (err) {
    console.error("[fetch-live-scores] openligadb error:", err);
    if (cached) {
      return json({ fixtures: cached.payload?.response ?? [], cache: "stale" }, 200);
    }
    return json({ error: "Failed to fetch live data.", fixtures: [] }, 502);
  }
});

/**
 * Translate one OpenLigaDB match → legacy RawFixture shape.
 *
 * OpenLigaDB key fields:
 *   matchID, matchDateTimeUTC, matchIsFinished,
 *   team1{teamName,shortName}, team2{teamName,shortName},
 *   matchResults[{resultName, pointsTeam1, pointsTeam2, resultOrderID, resultTypeID}],
 *   goals[{matchMinute, scoreTeam1, scoreTeam2}],
 *   location{locationStadium, locationCity}
 */
function mapOpenLigaMatch(m: any): any | null {
  if (!m || !m.team1 || !m.team2) return null;

  const dateIso = m.matchDateTimeUTC
    ? new Date(m.matchDateTimeUTC).toISOString()
    : undefined;
  const kickoff = dateIso ? new Date(dateIso).getTime() : NaN;
  const now = Date.now();

  // Determine status
  let statusShort = "NS";
  if (m.matchIsFinished) {
    statusShort = "FT";
  } else if (!Number.isNaN(kickoff)) {
    if (now >= kickoff && now <= kickoff + MATCH_WINDOW_MS) {
      statusShort = "1H"; // live
    }
  }

  // Final result preferred; fallback to last goal scoreline
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

  // Elapsed minute for live matches
  let elapsed: number | null = null;
  if (statusShort === "1H" && !Number.isNaN(kickoff)) {
    const raw = Math.floor((now - kickoff) / 60_000);
    let mm = Math.min(120, Math.max(1, raw));
    if (mm > 45 && mm < 60) mm = 45; // half-time clamp
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
