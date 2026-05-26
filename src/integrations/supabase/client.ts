import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!configured) {
  console.error(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Live data + auth will not work until both are configured."
  );
}

// Stub client used when env vars are missing — prevents createClient() from
// throwing "supabaseUrl is required" during SSR and crashing the whole app.
const stub = {
  functions: {
    invoke: async () => ({
      data: null,
      error: new Error("Supabase not configured"),
    }),
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
} as unknown as SupabaseClient;

export const supabase: SupabaseClient = configured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : stub;

export const isSupabaseConfigured = (): boolean => configured;
