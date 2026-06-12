/**
 * Supabase Edge Function: fetch-live-scores
 *
 * Proxies live FIFA World Cup fixture data from API-Football with a
 * server-side cache table `live_fixtures_cache` to protect our quota.
 *  - mode === "live"  → cache valid for 60s
 *  - mode === "idle"  → cache valid for 4h
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // --- Parse body for mode ---------------------------------------------------
  let mode: "live" | "idle" = "live";
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.mode === "idle") mode = "idle";
    }
  } catch {
    /* default to live */
  }

  // --- AuthN: require a valid Supabase JWT ----------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized", fixtures: [] }, 401);
  }

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
    if (authErr || !user) {
      return json({ error: "Unauthorized", fixtures: [] }, 401);
    }
  } catch (err) {
    console.error("[fetch-live-scores] auth check failed:", err);
    return json({ error: "Unauthorized", fixtures: [] }, 401);
  }

  // --- Admin client for cache table (bypasses RLS) --------------------------
  const admin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  // --- Cache lookup ---------------------------------------------------------
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

  // --- Upstream call --------------------------------------------------------
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) {
    console.error("[fetch-live-scores] upstream API key not configured");
    if (cached) {
      return json({ fixtures: cached.payload?.response ?? [], cache: "stale" }, 200);
    }
    return json({ error: "Service temporarily unavailable.", fixtures: [] }, 500);
  }

  try {
    const url = mode === "live"
      ? "https://v3.football.api-sports.io/fixtures?live=all"
      : "https://v3.football.api-sports.io/fixtures?league=1&season=2026";

    const upstream = await fetch(url, { headers: { "x-apisports-key": apiKey } });

    if (!upstream.ok) {
      console.error("[fetch-live-scores] upstream non-ok:", upstream.status);
      if (cached) {
        return json({ fixtures: cached.payload?.response ?? [], cache: "stale" }, 200);
      }
      return json({ error: "Upstream error", fixtures: [] }, 502);
    }

    const payload = await upstream.json();

    if (admin) {
      await admin
        .from("live_fixtures_cache")
        .upsert({
          id: CACHE_ID,
          payload,
          fetched_at: new Date().toISOString(),
        });
    }

    console.log(`[fetch-live-scores] cache MISS (mode=${mode}) — upstream OK`);
    return json({ fixtures: payload.response ?? [], cache: "miss" }, 200);
  } catch (err) {
    console.error("[fetch-live-scores] upstream error:", err);
    if (cached) {
      return json({ fixtures: cached.payload?.response ?? [], cache: "stale" }, 200);
    }
    return json({ error: "Failed to fetch live data.", fixtures: [] }, 502);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
