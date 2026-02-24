import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Vite only exposes env vars that start with VITE_. Loaded from .env at dev server start.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase: SupabaseClient = createClient(url, publishableKey);
