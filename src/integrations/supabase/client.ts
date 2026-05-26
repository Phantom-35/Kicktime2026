import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Publishable keys for the "Kick Time 2026" Supabase project.
// The anon key is safe to ship in the client bundle — RLS gates row access
// on the Supabase side. The secret API_FOOTBALL_KEY stays server-side inside
// the `fetch-live-scores` Edge Function.
const SUPABASE_URL = "https://bbdnnohujyvickhegbuf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZG5ub2h1anl2aWNraGVnYnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTYwMDUsImV4cCI6MjA5NTI5MjAwNX0.TnxGmMWkKcwLBiAM831u68qbJcby2RCHbt_ZHv0t_so";

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

export const isSupabaseConfigured = (): boolean => true;
