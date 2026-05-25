/**
 * Supabase Edge Function: fetch-live-scores
 *
 * Proxies live FIFA World Cup fixture data from API-Football so the secret
 * `API_FOOTBALL_KEY` never ships inside the iOS / web bundle.
 *
 * SETUP (one-time, in Supabase Dashboard):
 *   1. Project → Edge Functions → Manage secrets
 *   2. Add:   API_FOOTBALL_KEY = <your api-football.com key>
 *   3. Save. Lovable Cloud auto-deploys this function from `supabase/functions/`.
 *
 * Client usage:
 *   const { data, error } = await supabase.functions.invoke('fetch-live-scores')
 *   // data.fixtures  → raw API-Football "response" array (already filtered to live)
 */

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) {
    return json(
      {
        error:
          "API_FOOTBALL_KEY is not set. Add it under Supabase Dashboard → Edge Functions → Secrets.",
        fixtures: [],
      },
      500
    );
  }

  try {
    const upstream = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      { headers: { "x-apisports-key": apiKey } }
    );

    if (!upstream.ok) {
      return json(
        {
          error: `API-Football responded ${upstream.status}`,
          fixtures: [],
        },
        502
      );
    }

    const payload = (await upstream.json()) as { response?: any[] };
    return json({ fixtures: payload.response ?? [] }, 200);
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : "Unknown upstream error",
        fixtures: [],
      },
      502
    );
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
