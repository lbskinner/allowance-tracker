import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Vite only exposes env vars that start with VITE_. Loaded from .env at dev server start.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)

export const supabase: SupabaseClient | null = url && anonKey
  ? createClient(url!, anonKey!)
  : null
