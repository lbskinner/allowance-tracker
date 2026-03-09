import { lazy, Suspense } from 'react'
import { ReadOnlyView } from './components/ReadOnlyView'

const AuthProvider = lazy(() =>
  import('./contexts/AuthContext').then((m) => ({ default: m.AuthProvider }))
)
const App = lazy(() => import('./App'))

interface RootProps {
  viewToken: string | null
}

export function Root({ viewToken }: RootProps) {
  if (viewToken) {
    return <ReadOnlyView token={decodeURIComponent(viewToken)} />
  }
  return (
    <AuthProvider>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
        <App />
      </Suspense>
    </AuthProvider>
  )
}
