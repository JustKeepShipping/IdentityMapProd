import { createClient, SupabaseClient } from '@supabase/supabase-js';

/*
 * supabaseAdmin creates a Supabase client using a service role key.  The
 * service role key has elevated privileges and bypasses row‑level security
 * (RLS) policies.  It must never be exposed to the client.  On the
 * server we read SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
 * environment.  If they are missing, an error is thrown at import time.
 */

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}
if (!serviceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
  },
});
