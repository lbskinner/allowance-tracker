import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuth } from './useAuth'
import { AuthContext } from './context'
import type { AuthContextValue } from './context'

function Consumer() {
  const auth = useAuth()
  return <span data-testid="auth-value">{auth.loading ? 'loading' : auth.session ? 'signed-in' : 'signed-out'}</span>
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function BadConsumer() {
      useAuth()
      return null
    }
    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within an AuthProvider')
    consoleSpy.mockRestore()
  })

  it('returns context value when used inside AuthProvider', () => {
    const value: AuthContextValue = {
      session: null,
      loading: false,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue(undefined),
    }
    render(
      <AuthContext.Provider value={value}>
        <Consumer />
      </AuthContext.Provider>
    )
    expect(screen.getByTestId('auth-value')).toHaveTextContent('signed-out')
  })

  it('exposes loading and session from provider value', () => {
    const value: AuthContextValue = {
      session: { user: { id: '1' }, access_token: 'x', refresh_token: 'y', expires_in: 3600 } as AuthContextValue['session'],
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }
    render(
      <AuthContext.Provider value={value}>
        <Consumer />
      </AuthContext.Provider>
    )
    expect(screen.getByTestId('auth-value')).toHaveTextContent('signed-in')
  })
})
