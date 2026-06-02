import { createClient } from "@supabase/supabase-js";
import { runtimeConfig } from "@/lib/config";

export function getSupabaseAdmin() {
  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseServiceKey) {
    throw new Error("Supabase URL and service role key are required.");
  }

  return createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
