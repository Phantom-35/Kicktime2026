/**
 * VAPID Public Key — wird vom Browser benötigt, um eine Push-Subscription
 * beim Apple/Google/Mozilla-Push-Service anzulegen.
 *
 * SETUP (einmalig):
 * 1. VAPID-Keypair online generieren (z. B. https://vapidkeys.com).
 * 2. Public-Key HIER eintragen ODER als `VITE_VAPID_PUBLIC_KEY` in der
 *    Lovable-Umgebungsvariable setzen.
 * 3. Private-Key + Subject als Supabase-Secrets eintragen:
 *    - VAPID_PRIVATE_KEY
 *    - VAPID_SUBJECT  (z. B. "mailto:du@example.com")
 *
 * Der Public-Key ist öffentlich und unkritisch — er darf im Client liegen.
 */

const FALLBACK_PUBLIC_KEY = ""; // <-- TODO: hier deinen VAPID Public Key reinkopieren

export function getVapidPublicKey(): string {
  // Vite ersetzt import.meta.env.* zur Build-Zeit
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY) ||
    "";
  return (fromEnv || FALLBACK_PUBLIC_KEY).trim();
}

export function hasVapidPublicKey(): boolean {
  return getVapidPublicKey().length > 20;
}
