/**
 * Anonymous telemetry — sends a periodic ping with a randomly generated
 * client id (persisted in localStorage). No PII, no IP logging.
 */
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/lib/version";
import { useAppStore } from "@/store/app-store";

const CLIENT_ID_KEY = "kicktime-client-id";
const LAST_PING_KEY = "kicktime-last-ping";
const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 min throttle

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for older browsers
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export async function sendPing(force = false): Promise<void> {
  try {
    const last = Number(localStorage.getItem(LAST_PING_KEY) ?? "0");
    if (!force && Date.now() - last < PING_INTERVAL_MS) return;

    const favs = useAppStore.getState().favoriteTeams;
    const payload = {
      client_id: getClientId(),
      last_ping: new Date().toISOString(),
      app_version: APP_VERSION,
      fav_team: favs[0] ?? null,
    };
    const { error } = await supabase
      .from("app_pings")
      .upsert(payload, { onConflict: "client_id" });
    if (error) {
      // Silent — telemetry must never break the app
      console.debug("[telemetry] ping failed", error.message);
      return;
    }
    localStorage.setItem(LAST_PING_KEY, String(Date.now()));
  } catch (e) {
    console.debug("[telemetry] error", e);
  }
}
