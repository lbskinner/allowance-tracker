import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import './index.css'
import { hasSupabase } from './lib/supabase'
import { SetupMessage } from './SetupMessage'

const AuthProvider = lazy(() =>
  import('./contexts/AuthContext').then((m) => ({ default: m.AuthProvider }))
)
const App = lazy(() => import('./App'))

createRoot(document.getElementById('root')!).render(
  hasSupabase ? (
    <AuthProvider>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
        <App />
      </Suspense>
    </AuthProvider>
  ) : (
    <SetupMessage />
  )
)
