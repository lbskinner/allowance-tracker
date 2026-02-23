import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env from same directory as this config file (project root)
  const env = loadEnv(mode, __dirname, '')
  const url = env.VITE_SUPABASE_URL ?? ''
  const anonKey = env.VITE_SUPABASE_ANON_KEY ?? ''
  if (mode === 'development') {
    console.log('[vite] Supabase env:', url ? 'VITE_SUPABASE_URL set' : 'VITE_SUPABASE_URL missing', anonKey ? 'VITE_SUPABASE_ANON_KEY set' : 'VITE_SUPABASE_ANON_KEY missing')
  }
  return {
    plugins: [react()],
    envDir: __dirname,
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anonKey),
    },
  }
})
