import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Returns the shared Supabase client, or null when env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const NOT_CONFIGURED =
  "Findbus isn't connected to its database yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

/** Calls a findbus database function and throws a readable error on failure. */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const sb = getSupabase();
  if (!sb) throw new Error(NOT_CONFIGURED);
  const { data, error } = await sb.rpc(fn, args);
  if (error) {
    if (error.code === "P0002") throw new Error("That link is not valid any more.");
    throw new Error(error.message);
  }
  return data as T;
}
