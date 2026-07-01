/**
 * Zentrales App-weites Fehler-Log (v7.7).
 *
 * Alle System-, DB-, Auth-, Tipp- und Frontend-Fehler laufen hier zusammen
 * und landen im `apiErrorLog`-Slice des `useAppStore` — sichtbar im
 * Admin-Panel unter „System → Fehler-Log".
 */

import { useAppStore } from "@/store/app-store";

export type ErrorCategory =
  | "api"
  | "supabase"
  | "auth"
  | "prediction"
  | "render"
  | "network"
  | "push"
  | "system";

export function logError(
  category: ErrorCategory,
  message: string,
  meta?: { url?: string; phase?: number | null }
): void {
  try {
    useAppStore.getState().logApiError(
      meta?.url ?? category,
      `[${category}] ${message}`,
      meta?.phase ?? null,
      category
    );
  } catch {
    // Never let the logger itself break the app.
  }
}
