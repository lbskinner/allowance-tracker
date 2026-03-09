import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReadOnlyView } from './ReadOnlyView'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

describe('ReadOnlyView', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset()
  })

  it('shows loading initially', () => {
    vi.mocked(supabase.rpc).mockReturnValue(
      new Promise(() => {}) as unknown as ReturnType<typeof supabase.rpc>
    )
    render(<ReadOnlyView token="some-token" />)
    expect(screen.getByText(/loading…/i)).toBeInTheDocument()
  })

  it('shows error when RPC returns error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'DB error' } } as never)
    render(<ReadOnlyView token="bad-token" />)
    expect(await screen.findByText('DB error')).toBeInTheDocument()
  })

  it('shows invalid link message when result is null', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    render(<ReadOnlyView token="expired" />)
    expect(await screen.findByText(/invalid or expired link/i)).toBeInTheDocument()
  })

  it('renders kid name and balance when data loaded', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        kidName: 'Alex',
        kidId: 'k1',
        currentBalance: 42.5,
        transactions: [],
      },
      error: null,
    } as never)
    render(<ReadOnlyView token="valid-token" />)
    expect(await screen.findByText(/my allowance – alex/i)).toBeInTheDocument()
    expect(screen.getByText(/current balance:/i)).toHaveTextContent(/42\.50/)
  })

  it('shows empty state when no transactions', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        kidName: 'Alex',
        kidId: 'k1',
        currentBalance: 0,
        transactions: [],
      },
      error: null,
    } as never)
    render(<ReadOnlyView token="valid-token" />)
    expect(await screen.findByText(/no transactions in the last 30 days/i)).toBeInTheDocument()
  })

  it('renders transaction list when transactions present', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        kidName: 'Alex',
        kidId: 'k1',
        currentBalance: 10,
        transactions: [
          {
            id: 't1',
            kid_id: 'k1',
            type: 'credit',
            amount: 10,
            date: '2024-01-15T00:00:00Z',
            description: 'Allowance',
            added_by_display: null,
          },
        ],
      },
      error: null,
    } as never)
    render(<ReadOnlyView token="valid-token" />)
    expect(await screen.findByText('+$10.00')).toBeInTheDocument()
    expect(screen.getByText('Allowance')).toBeInTheDocument()
  })
})
