import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL

// Supabase's new publishable key (sb_publishable_…) replaces the legacy anon
// key. Both carry the same low privileges and both work here; prefer the new
// one, but keep reading the old name so existing deployments don't break.
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Null until both env vars are set. Every caller must handle that: with no
 * Supabase project configured the app still runs, backed by localStorage alone.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null

export const cloudConfigured = supabase !== null
