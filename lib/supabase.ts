import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Server-only (cron jobs, route handlers) — service_role bypasses RLS
export function createSupabaseAdmin() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY',
    )
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Client-safe (anon key, respects RLS)
export function createSupabaseClient() {
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing env: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }
  return createClient(supabaseUrl, anonKey)
}
