import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Vite only exposes env vars that start with VITE_. Loaded from .env at dev server start.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)

export const hasSupabase = Boolean(url && anonKey)
if (import.meta.env.DEV && !hasSupabase) {
  console.warn(
    '[Allowance Tracker] Supabase env not loaded. Check: (1) .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY), (2) no spaces around =, (3) dev server was restarted after editing .env.'
  )
}
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, anonKey!)
  : null
