import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/useAuth'

type Mode = 'signin' | 'signup'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    try {
      const { error: err } =
        mode === 'signin'
          ? await signIn(email, password)
          : await signUp(email, password)
      if (err) {
        setError(err.message)
        return
      }
      if (mode === 'signup') {
        setMessage('Check your email to confirm your account, then sign in.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Allowance Tracker</h1>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'Sign in to continue' : 'Create an account'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => {
              setMode('signin')
              setError(null)
              setMessage(null)
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup')
              setError(null)
              setMessage(null)
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={submitting}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              disabled={submitting}
            />
          </label>
          {mode === 'signup' && (
            <p className="auth-hint">Use at least 6 characters for your password.</p>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  )
}

