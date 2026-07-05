/**
 * Client helpers for the manual admin override layer.
 *
 * Writes go EXCLUSIVELY through the `admin-override` edge function, which
 * validates the PIN server-side (ADMIN_PIN secret) and uses the service-role
 * key. The client never holds the PIN in its source and no anon writes to
 * `match_overrides` are performed here — the RLS policy on that table denies
 * anon/authenticated INSERT/UPDATE/DELETE.
 */

import { supabase } from "@/integrations/supabase/client";
import { useMatchStore } from "@/store/match-store";
import { logError } from "@/lib/error-log";

export type MatchOverride = {
  match_id: string;
  score_a: number;
  score_b: number;
  minute: number | null;
  status: "scheduled" | "live" | "finished";
  is_manual: boolean;
  updated_at: string;
};

export async function fetchMatchOverrides(): Promise<MatchOverride[]> {
  try {
    const { data, error } = await supabase
      .from("match_overrides")
      .select("match_id, score_a, score_b, minute, status, is_manual, updated_at");
    if (error) {
      console.warn("[match-overrides] select failed:", error.message);
      logError("supabase", `overrides select failed: ${error.message}`);
      return [];
    }
    return (data ?? []) as MatchOverride[];
  } catch (err) {
    console.warn("[match-overrides] fetch threw:", err);
    logError("supabase", `overrides fetch threw: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export function applyOverridesToStore(overrides: MatchOverride[]): void {
  if (overrides.length === 0) return;
  const state = useMatchStore.getState();
  for (const o of overrides) {
    const m = state.matches[o.match_id];
    if (!m) continue;
    if (o.status === "finished") {
      state.finishMatch(o.match_id, { a: o.score_a, b: o.score_b });
    } else {
      state.applyManualUpdate(o.match_id, {
        status: o.status,
        liveScore: { a: o.score_a, b: o.score_b },
        matchMinute: o.minute ?? undefined,
      });
    }
  }
}

async function invokeAdmin(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; data?: any }> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-override", { body });
    if (error) return { ok: false, error: error.message };
    if (data && typeof data === "object" && (data as any).error) {
      return { ok: false, error: String((data as any).error) };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const res = await invokeAdmin({ action: "verify", pin });
  return res.ok;
}

export async function setMatchOverride(payload: {
  pin: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  minute: number | null;
  status: "scheduled" | "live" | "finished";
}): Promise<{ ok: boolean; error?: string }> {
  if (!payload.matchId) return { ok: false, error: "Invalid payload" };
  if (!Number.isFinite(payload.scoreA) || !Number.isFinite(payload.scoreB)) {
    return { ok: false, error: "Invalid score" };
  }
  if (!["scheduled", "live", "finished"].includes(payload.status)) {
    return { ok: false, error: "Invalid status" };
  }

  const res = await invokeAdmin({
    action: "set",
    pin: payload.pin,
    matchId: payload.matchId,
    scoreA: payload.scoreA,
    scoreB: payload.scoreB,
    minute: payload.minute,
    status: payload.status,
  });
  if (!res.ok) {
    logError("supabase", `override upsert failed: ${res.error}`);
    return res;
  }

  // Direkt lokal anwenden — die kanonische Zeile kommt vom Server zurück.
  const row = (res.data && (res.data as any).row) as MatchOverride | undefined;
  if (row) applyOverridesToStore([row]);
  return { ok: true };
}

export async function clearMatchOverride(payload: {
  pin: string;
  matchId: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!payload.matchId) return { ok: false, error: "Invalid payload" };
  const res = await invokeAdmin({
    action: "clear",
    pin: payload.pin,
    matchId: payload.matchId,
  });
  if (!res.ok) {
    logError("supabase", `override delete failed: ${res.error}`);
    return res;
  }
  useMatchStore.getState().clearLiveOverlay(payload.matchId);
  useMatchStore.getState().syncWithRealTime();
  return { ok: true };
}

/* -----------------------------------------------------------------------------
 * Erforderliche Supabase-Konfiguration (siehe Migration
 * supabase/migrations/*_lock_match_overrides.sql):
 *
 *   alter table public.match_overrides enable row level security;
 *   grant select on public.match_overrides to anon, authenticated;
 *   revoke insert, update, delete on public.match_overrides from anon, authenticated;
 *
 *   -- Nur SELECT ist öffentlich; sämtliche Writes laufen ausschließlich über
 *   -- die Edge Function `admin-override` (service-role key), die den PIN
 *   -- serverseitig gegen die ADMIN_PIN-Secret validiert.
 * --------------------------------------------------------------------------- */
