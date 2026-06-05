/**
 * Lightweight haptic-feedback wrapper using the standard Vibration API.
 * Silently no-ops on browsers / devices that don't support it (e.g. iOS Safari).
 */
function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  const v = (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate;
  if (typeof v !== "function") return;
  try {
    v.call(navigator, pattern);
  } catch {
    /* noop */
  }
}

export const haptics = {
  tap: () => vibrate(8),
  success: () => vibrate([10, 30, 10]),
  warn: () => vibrate([20, 40, 20]),
};
