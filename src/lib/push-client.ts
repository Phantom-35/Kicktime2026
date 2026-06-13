/**
 * Service-Worker-Registrierung + Push-Subscription für Web Push (W3C / VAPID).
 *
 * Sicher in Lovable-Preview-Kontexten — wir registrieren NICHT in dev,
 * Preview-Iframes, oder wenn `?sw=off` gesetzt ist. Bestehende Worker
 * werden in diesen Kontexten abgemeldet, damit Preview-Builds nicht stale
 * cachen (unser SW cached eh nichts — er empfängt nur Push).
 */

import { getVapidPublicKey, hasVapidPublicKey } from "./push-config";

const SW_PATH = "/sw.js";

function isUnsafeContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true; // iframe (preview)
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com"))
    return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterMatching(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL;
      if (url && new URL(url).pathname === SW_PATH) {
        await r.unregister();
      }
    }
  } catch {
    /* noop */
  }
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (isUnsafeContext()) {
    await unregisterMatching();
    return null;
  }
  if (!("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (existing) return existing;
    return await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch (err) {
    console.warn("[push] SW register failed", err);
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type SerializedSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function serialize(sub: PushSubscription): SerializedSubscription | null {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return null;
  return { endpoint: json.endpoint, p256dh, auth };
}

/** Aktiviert Permission + Subscription. Liefert serialisierte Sub für DB-Upsert. */
export async function subscribeForPush(): Promise<SerializedSubscription | null> {
  if (typeof window === "undefined") return null;
  if (!hasVapidPublicKey()) {
    console.warn("[push] VAPID public key fehlt — siehe src/lib/push-config.ts");
    return null;
  }
  if (!("Notification" in window)) return null;
  if (Notification.permission === "denied") return null;
  if (Notification.permission === "default") {
    const res = await Notification.requestPermission();
    if (res !== "granted") return null;
  }
  const reg = await ensureServiceWorker();
  if (!reg) return null;

  // Auf bestehende Subscription zurückgreifen, sonst neu anlegen
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = urlBase64ToUint8Array(getVapidPublicKey());
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key.buffer.slice(
        key.byteOffset,
        key.byteOffset + key.byteLength
      ) as ArrayBuffer,
    });
  }
  return serialize(sub);
}

/** Holt die aktuelle Subscription, ohne Permission anzufragen. */
export async function getCurrentSubscription(): Promise<SerializedSubscription | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  return sub ? serialize(sub) : null;
}
