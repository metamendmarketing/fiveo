import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Utility Singletons
 * 
 * Manages connections for both Server-side (Service Role) 
 * and Client-side (Public Anon) access patterns.
 */

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client authorized for server-side operations.
 * Uses the Service Role key for full database access.
 */
export function getServerSupabase(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("[Supabase] Missing Server Environment Variables.");
  }

  serverClient = createClient(url, key);
  return serverClient;
}

/**
 * Returns a Supabase client authorized for browser-side operations.
 * Uses the Public Anon key for restricted read-only access.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("[Supabase] Missing Client Environment Variables.");
  }

  browserClient = createClient(url, key);
  return browserClient;
}
