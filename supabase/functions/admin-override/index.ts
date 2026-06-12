/**
 * Supabase Edge Function: admin-override
 *
 * Allows the (PIN-protected) Admin Panel to insert or clear manual
 * match overrides in `match_overrides`. PIN is validated server-side
 * as defense-in-depth — never trust the client gate alone.
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

const ADMIN_PIN = "031011";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return json({ error: "Service not configured" }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body?.pin !== ADMIN_PIN) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const action = body?.action;

  if (action === "set") {
    const matchId = String(body.matchId ?? "");
    const scoreA = Number(body.scoreA);
    const scoreB = Number(body.scoreB);
    const minute = body.minute === null || body.minute === undefined ? null : Number(body.minute);
    const status = String(body.status ?? "live");
    if (!matchId || !Number.isFinite(scoreA) || !Number.isFinite(scoreB)) {
      return json({ error: "Invalid payload" }, 400);
    }
    if (!["scheduled", "live", "finished"].includes(status)) {
      return json({ error: "Invalid status" }, 400);
    }
    const { error } = await admin
      .from("match_overrides")
      .upsert({
        match_id: matchId,
        score_a: Math.max(0, Math.min(50, Math.floor(scoreA))),
        score_b: Math.max(0, Math.min(50, Math.floor(scoreB))),
        minute: minute === null ? null : Math.max(0, Math.min(120, Math.floor(minute))),
        status,
        is_manual: true,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.error("[admin-override] upsert failed:", error);
      return json({ error: error.message }, 500);
    }
    return json({ ok: true }, 200);
  }

  if (action === "clear") {
    const matchId = String(body.matchId ?? "");
    if (!matchId) return json({ error: "Invalid payload" }, 400);
    const { error } = await admin
      .from("match_overrides")
      .delete()
      .eq("match_id", matchId);
    if (error) {
      console.error("[admin-override] delete failed:", error);
      return json({ error: error.message }, 500);
    }
    return json({ ok: true }, 200);
  }

  return json({ error: "Unknown action" }, 400);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
