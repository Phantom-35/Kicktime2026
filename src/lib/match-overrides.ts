/**
 * Client helpers for the manual admin override layer.
 *
 * Reads:  any user can SELECT from match_overrides (anon policy).
 * Writes: only via the `admin-override` edge function, which validates the PIN
 *         server-side and writes via the service-role key.
 */

import { supabase } from "@/integrations/supabase/client";
import { useMatchStore } from "@/store/match-store";

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
      return [];
    }
    return (data ?? []) as MatchOverride[];
  } catch (err) {
    console.warn("[match-overrides] fetch threw:", err);
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
      state.applyLiveUpdate(o.match_id, {
        status: o.status,
        liveScore: { a: o.score_a, b: o.score_b },
        matchMinute: o.minute ?? undefined,
      });
    }
  }
}

export async function setMatchOverride(payload: {
  pin: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  minute: number | null;
  status: "scheduled" | "live" | "finished";
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    "admin-override",
    {
      body: {
        action: "set",
        pin: payload.pin,
        matchId: payload.matchId,
        scoreA: payload.scoreA,
        scoreB: payload.scoreB,
        minute: payload.minute,
        status: payload.status,
      },
    },
  );
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}

export async function clearMatchOverride(payload: {
  pin: string;
  matchId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    "admin-override",
    {
      body: { action: "clear", pin: payload.pin, matchId: payload.matchId },
    },
  );
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}
