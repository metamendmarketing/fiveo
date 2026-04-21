/**
 * Supabase Client — Server & Client singletons
 *
 * Server client uses the service key (full access) for API routes.
 * Client uses the anon key (read-only) for browser-side vehicle dropdowns.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Server Client (API Routes only) ───
let serverClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables."
    );
  }

  serverClient = createClient(url, key);
  return serverClient;
}

// ─── Client (Browser — read-only for vehicle cascade) ───
let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  browserClient = createClient(url, key);
  return browserClient;
}
