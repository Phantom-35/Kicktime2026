/**
 * Lightweight notification helpers.
 *
 * Push on iOS only works for apps installed to the Home Screen (iOS 16.4+).
 * Without a service worker / push backend we can only fire local
 * notifications via `new Notification(...)` while the tab is open. We
 * surface this transparently to the user in the Profil tab.
 */

export type PushSupport =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "ios-needs-pwa";

const isIos = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const isStandalonePwa = () => {
  if (typeof window === "undefined") return false;
  // iOS uses navigator.standalone, others use display-mode media query
  // @ts-expect-error iOS-specific
  if (window.navigator.standalone === true) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
};

export function detectPushSupport(): PushSupport {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  if (isIos() && !isStandalonePwa()) return "ios-needs-pwa";
  return Notification.permission as PushSupport;
}

export async function requestPushPermission(): Promise<PushSupport> {
  const support = detectPushSupport();
  if (support === "unsupported" || support === "ios-needs-pwa") return support;
  try {
    const result = await Notification.requestPermission();
    return result as PushSupport;
  } catch {
    return "denied";
  }
}

export function showLocalNotification(title: string, body: string): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: title, badge: "/favicon.ico" });
  } catch {
    /* noop */
  }
}

/** Schedule a local notification at a given absolute timestamp (ms epoch).
 *  Returns a cancel function. Only fires while the tab is open. */
export function scheduleLocalNotification(
  whenMs: number,
  title: string,
  body: string
): () => void {
  if (typeof window === "undefined") return () => {};
  const delay = whenMs - Date.now();
  if (delay <= 0) return () => {};
  // setTimeout caps near ~24.8 days; our use case is well below that
  const handle = window.setTimeout(() => showLocalNotification(title, body), delay);
  return () => window.clearTimeout(handle);
}
