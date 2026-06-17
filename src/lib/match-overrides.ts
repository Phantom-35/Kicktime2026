/**
 * Client helpers for the manual admin override layer.
 *
 * Writes go DIRECTLY to the `match_overrides` table via the public Supabase
 * client — no edge function involved. The PIN gate lives in the Admin Panel
 * UI; database-level protection comes from RLS policies you configure in
 * Supabase (see SQL note at the bottom of this file).
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

const ADMIN_PIN = "031011";

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
      state.applyManualUpdate(o.match_id, {
        status: o.status,
        liveScore: { a: o.score_a, b: o.score_b },
        matchMinute: o.minute ?? undefined,
      });
    }
  }
}


function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(v)));
}

export async function setMatchOverride(payload: {
  pin: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  minute: number | null;
  status: "scheduled" | "live" | "finished";
}): Promise<{ ok: boolean; error?: string }> {
  if (payload.pin !== ADMIN_PIN) return { ok: false, error: "Unauthorized" };
  if (!payload.matchId) return { ok: false, error: "Invalid payload" };
  if (!Number.isFinite(payload.scoreA) || !Number.isFinite(payload.scoreB)) {
    return { ok: false, error: "Invalid score" };
  }
  if (!["scheduled", "live", "finished"].includes(payload.status)) {
    return { ok: false, error: "Invalid status" };
  }

  const row = {
    match_id: payload.matchId,
    score_a: clampInt(payload.scoreA, 0, 50),
    score_b: clampInt(payload.scoreB, 0, 50),
    minute: payload.minute === null ? null : clampInt(payload.minute, 0, 120),
    status: payload.status,
    is_manual: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("match_overrides")
    .upsert(row, { onConflict: "match_id" });
  if (error) {
    console.error("[match-overrides] upsert failed:", error);
    return { ok: false, error: error.message };
  }

  // Direkt im lokalen Store anwenden, damit die UI sofort reagiert.
  applyOverridesToStore([row as MatchOverride]);
  return { ok: true };
}

export async function clearMatchOverride(payload: {
  pin: string;
  matchId: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (payload.pin !== ADMIN_PIN) return { ok: false, error: "Unauthorized" };
  if (!payload.matchId) return { ok: false, error: "Invalid payload" };

  const { error } = await supabase
    .from("match_overrides")
    .delete()
    .eq("match_id", payload.matchId);
  if (error) {
    console.error("[match-overrides] delete failed:", error);
    return { ok: false, error: error.message };
  }
  // Sofort lokal entfernen — kein Wackeln, syncWithRealTime füllt Live-Status
  // beim nächsten Tick wieder aus den Kickoff-Zeiten / API-Daten.
  useMatchStore.getState().clearLiveOverlay(payload.matchId);
  useMatchStore.getState().syncWithRealTime();
  return { ok: true };
}

/* -----------------------------------------------------------------------------
 * Erforderliche Supabase-Konfiguration (einmalig im SQL-Editor ausführen):
 *
 *   alter table public.match_overrides enable row level security;
 *   grant select, insert, update, delete on public.match_overrides to anon, authenticated;
 *
 *   drop policy if exists "anon read overrides" on public.match_overrides;
 *   create policy "anon read overrides" on public.match_overrides
 *     for select to anon, authenticated using (true);
 *
 *   drop policy if exists "anon write overrides" on public.match_overrides;
 *   create policy "anon write overrides" on public.match_overrides
 *     for all to anon, authenticated using (true) with check (true);
 *
 * Hinweis: Der Schutz liegt damit ausschließlich auf der PIN im Frontend.
 * Wer den anon-Key + die PIN kennt, kann Overrides schreiben.
 * --------------------------------------------------------------------------- */
