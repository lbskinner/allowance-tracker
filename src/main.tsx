import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import './index.css'
import { hasSupabase } from './lib/supabase'
import { SetupMessage } from './SetupMessage'
import { ReadOnlyView } from './ReadOnlyView'

const AuthProvider = lazy(() =>
  import('./contexts/AuthContext').then((m) => ({ default: m.AuthProvider }))
)
const App = lazy(() => import('./App'))

const path = window.location.pathname
const viewMatch = path.match(/^\/view\/([^/]+)/)
const viewToken = viewMatch ? viewMatch[1] : null

function Root() {
  if (viewToken) {
    return <ReadOnlyView token={decodeURIComponent(viewToken)} />
  }
  if (!hasSupabase) {
    return <SetupMessage />
  }
  return (
    <AuthProvider>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
        <App />
      </Suspense>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
