import { createClient, SupabaseClient } from '@supabase/supabase-js';

/*
 * supabase is a client‑side Supabase instance.  It uses the anon key and
 * is safe to expose to the browser.  This client is used for reading
 * data directly from Supabase when permitted by RLS policies.  For
 * server‑side operations requiring elevated privileges use
 * `supabaseAdmin` from `lib/supabaseAdmin`.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, anonKey);
