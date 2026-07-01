/**
 * Anonymous telemetry — sends a periodic ping tied to a persistent device id.
 *
 * v7.7: Bot/refresh-Filter. Ein Ping wird NUR gesendet, wenn wenigstens EIN
 * "echter Nutzer"-Indikator vorliegt:
 *   - der Nutzer hat Notification-Permission erteilt (echtes Gerät hinter der App)
 *   - der Nutzer hat einen Favoriten (Onboarding wirklich durchlaufen)
 * Zusätzlich wird der User-Agent gegen eine Bot-Whitelist geprüft.
 */
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/lib/version";
import { useAppStore } from "@/store/app-store";
import { logError } from "@/lib/error-log";

const CLIENT_ID_KEY = "kicktime-client-id";
const LAST_PING_KEY = "kicktime-last-ping";
const PING_INTERVAL_MS = 5 * 60 * 1000;

const BOT_UA = /(bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|pingdom|uptime)/i;

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
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

function isRealUser(): boolean {
  try {
    if (typeof navigator !== "undefined" && BOT_UA.test(navigator.userAgent)) return false;
  } catch {
    return false;
  }
  // v7.7.1: jeder echte Browser zählt — nur Bots werden gefiltert.
  return true;
}

export async function sendPing(force = false): Promise<void> {
  try {
    if (!isRealUser()) return;
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
      logError("supabase", `telemetry ping failed: ${error.message}`);
      return;
    }
    localStorage.setItem(LAST_PING_KEY, String(Date.now()));
  } catch (e) {
    logError("system", `telemetry error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
