import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

const mockGetSession = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      }),
      signInWithPassword: (opts: { email: string; password: string }) => mockSignInWithPassword(opts),
      signUp: (opts: { email: string; password: string }) => mockSignUp(opts),
      signOut: () => mockSignOut(),
    },
  },
}))

function Consumer() {
  const { session, loading, signIn, signUp, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="session">{session ? 'in' : 'out'}</span>
      <button type="button" onClick={() => signIn('a@b.co', 'pass')}>
        Sign in
      </button>
      <button type="button" onClick={() => signUp('a@b.co', 'pass')}>
        Sign up
      </button>
      <button type="button" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null } })
  })

  it('renders children', () => {
    render(
      <AuthProvider>
        <span data-testid="child">Child</span>
      </AuthProvider>
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Child')
  })

  it('starts loading then resolves to session from getSession', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('session')).toHaveTextContent('out')
  })

  it('signIn calls supabase.auth.signInWithPassword', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pass' })
  })

  it('signUp calls supabase.auth.signUp', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    expect(mockSignUp).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pass' })
  })

  it('signOut calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalled()
  })
})
