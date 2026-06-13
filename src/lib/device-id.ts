/**
 * Geräte-ID — eine stabile, anonyme UUID pro Browser/Installation.
 *
 * Wird beim ersten Aufruf erzeugt und in `localStorage` persistiert. Dient
 * als „User-ID-Ersatz", solange das Projekt kein echtes Supabase-Auth nutzt.
 * Push-Subscriptions und Match-Alarm-Abos werden auf diese ID gemappt.
 */

const KEY = "kicktime.device_id";

function uuid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  // RFC4122 v4 Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = uuid();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return uuid();
  }
}
