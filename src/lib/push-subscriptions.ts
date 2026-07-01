/**
 * Supabase-Layer für Push-Abos und Match-Alarme.
 *
 * Tabellen (manuell im SQL-Editor anlegen):
 *  - push_subscriptions(device_id PK, endpoint, p256dh, auth, user_agent, last_seen_at)
 *  - match_alarm_subscriptions(device_id, match_id, kickoff_utc, lead_minutes, notified_at) PK(device_id, match_id)
 */

import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "./device-id";
import { logError } from "./error-log";
import type { SerializedSubscription } from "./push-client";

export async function upsertPushSubscription(
  sub: SerializedSubscription
): Promise<void> {
  const device_id = getDeviceId();
  const row = {
    device_id,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    last_seen_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(row, { onConflict: "device_id" });
  if (error) {
    console.warn("[push-subscriptions] upsert failed:", error.message);
    logError("push", `subscription upsert failed: ${error.message}`);
  }
}

export async function addMatchAlarm(
  matchId: string,
  kickoffUtc: string,
  teamAName?: string,
  teamBName?: string
): Promise<void> {
  const device_id = getDeviceId();
  const { error } = await supabase
    .from("match_alarm_subscriptions")
    .upsert(
      {
        device_id,
        match_id: matchId,
        kickoff_utc: kickoffUtc,
        lead_minutes: 15,
        notified_at: null,
        team_a_name: teamAName ?? null,
        team_b_name: teamBName ?? null,
      },
      { onConflict: "device_id,match_id" }
    );
  if (error) {
    console.warn("[push-subscriptions] alarm upsert failed:", error.message);
    logError("push", `alarm upsert failed: ${error.message}`);
  }
}

export async function removeMatchAlarm(matchId: string): Promise<void> {
  const device_id = getDeviceId();
  const { error } = await supabase
    .from("match_alarm_subscriptions")
    .delete()
    .eq("device_id", device_id)
    .eq("match_id", matchId);
  if (error) {
    console.warn("[push-subscriptions] alarm delete failed:", error.message);
    logError("push", `alarm delete failed: ${error.message}`);
  }
}
