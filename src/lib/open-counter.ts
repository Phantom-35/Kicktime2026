/**
 * Lokaler App-Opens-Counter. Wird einmal pro Mount der App erhöht und
 * triggert alle 15 Öffnungen die Feedback-Abfrage (genau ein Mal pro Schwelle).
 */

const COUNT_KEY = "kicktime.openCount";
const LAST_SHOWN_KEY = "kicktime.feedback.lastShownCount";
const FREQUENCY = 15;

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function incrementOpenCount(): number {
  const s = safeStorage();
  if (!s) return 0;
  const prev = parseInt(s.getItem(COUNT_KEY) ?? "0", 10) || 0;
  const next = prev + 1;
  s.setItem(COUNT_KEY, String(next));
  return next;
}

export function shouldShowFeedback(count: number): boolean {
  if (count <= 0 || count % FREQUENCY !== 0) return false;
  const s = safeStorage();
  if (!s) return false;
  const lastShown = parseInt(s.getItem(LAST_SHOWN_KEY) ?? "0", 10) || 0;
  return lastShown !== count;
}

export function markFeedbackShown(count: number): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(LAST_SHOWN_KEY, String(count));
}
