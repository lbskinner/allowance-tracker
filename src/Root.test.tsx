import { Suspense } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Root } from './Root'

vi.mock('./components/ReadOnlyView', () => ({
  ReadOnlyView: ({ token }: { token: string }) => (
    <div data-testid="read-only-view" data-token={token}>
      ReadOnlyView: {token}
    </div>
  ),
}))

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: unknown }) => <>{children}</>,
}))

vi.mock('./App', () => ({
  default: function MockApp() {
    return <div data-testid="app">App</div>
  },
}))

describe('Root', () => {
  it('renders ReadOnlyView with decoded token when viewToken is provided', () => {
    render(<Root viewToken="abc123" />)
    const view = screen.getByTestId('read-only-view')
    expect(view).toBeInTheDocument()
    expect(view).toHaveAttribute('data-token', 'abc123')
    expect(view).toHaveTextContent('ReadOnlyView: abc123')
  })

  it('decodes viewToken for ReadOnlyView', () => {
    render(<Root viewToken="a%2Fb%20c" />)
    const view = screen.getByTestId('read-only-view')
    expect(view).toHaveAttribute('data-token', 'a/b c')
  })

  it('renders AuthProvider and App when viewToken is null', async () => {
    render(
      <Suspense fallback={<div>Loading…</div>}>
        <Root viewToken={null} />
      </Suspense>
    )
    expect(await screen.findByTestId('app')).toHaveTextContent('App')
    expect(screen.queryByTestId('read-only-view')).not.toBeInTheDocument()
  })
})
