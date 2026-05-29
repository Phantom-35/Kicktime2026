/**
 * Supabase Edge Function: fetch-live-scores
 *
 * Proxies live FIFA World Cup fixture data from API-Football. The upstream
 * API key stays server-side; the function requires an authenticated caller
 * (valid Supabase JWT) so the third-party quota cannot be abused by anyone
 * holding the public anon key.
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // --- AuthN: require a valid Supabase JWT ----------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized", fixtures: [] }, 401);
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[fetch-live-scores] supabase env vars missing");
      return json({ error: "Service temporarily unavailable.", fixtures: [] }, 500);
    }
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

  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) {
    console.error("[fetch-live-scores] upstream API key not configured");
    return json({ error: "Service temporarily unavailable.", fixtures: [] }, 500);
  }

  try {
    const upstream = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      { headers: { "x-apisports-key": apiKey } },
    );

    if (!upstream.ok) {
      console.error("[fetch-live-scores] upstream non-ok:", upstream.status);
      return json({ error: "Upstream error", fixtures: [] }, 502);
    }

    const payload = (await upstream.json()) as { response?: any[] };
    return json({ fixtures: payload.response ?? [] }, 200);
  } catch (err) {
    console.error("[fetch-live-scores] upstream error:", err);
    return json({ error: "Failed to fetch live data.", fixtures: [] }, 502);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
