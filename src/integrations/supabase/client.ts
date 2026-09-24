import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Publishable keys for the "Kick Time 2026" Supabase project.
// The anon key is safe to ship in the client bundle — RLS gates row access
// on the Supabase side. The secret API_FOOTBALL_KEY stays server-side inside
// the `fetch-live-scores` Edge Function.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen — siehe .env.example");
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = (): boolean => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
