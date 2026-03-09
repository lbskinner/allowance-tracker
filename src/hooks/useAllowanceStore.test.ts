import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAllowanceStore } from './useAllowanceStore'

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}))

const promiseQueue: Promise<{ data: unknown; error: unknown }>[] = []
function enqueue(data: unknown, error: unknown = null) {
  promiseQueue.push(Promise.resolve({ data, error }))
}
function nextThenable() {
  return promiseQueue.shift() ?? Promise.resolve({ data: null, error: null })
}

// Kids table: .order() is the end of the chain (await), so order() returns the promise
const kidsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockImplementation(() => nextThenable()),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockImplementation(() => nextThenable()),
  gte: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
}

// Transactions table: .order() then .gte() then await, so order() returns this and gte() returns the promise
const transactionsChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  gte: vi.fn().mockImplementation(() => nextThenable()),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
}

describe('useAllowanceStore', () => {
  beforeEach(() => {
    mockFrom.mockClear()
    mockRpc.mockClear()
    promiseQueue.length = 0
    mockFrom.mockImplementation((table: string) =>
      table === 'transactions' ? transactionsChain : kidsChain
    )
  })

  it('returns empty kids and loading false when householdId is null', async () => {
    const { result } = renderHook(() => useAllowanceStore(null))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.kids).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches kids when householdId is set', async () => {
    const kidRows = [
      {
        id: 'k1',
        name: 'Alex',
        allowance_amount: 10,
        current_balance: 5,
        preset_amounts: [5, 10, 20],
      },
    ]
    enqueue(kidRows)
    const { result } = renderHook(() => useAllowanceStore('hh1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.kids).toHaveLength(1)
    expect(result.current.kids[0].id).toBe('k1')
    expect(result.current.kids[0].name).toBe('Alex')
    expect(result.current.kids[0].allowanceAmount).toBe(10)
    expect(result.current.kids[0].currentBalance).toBe(5)
    expect(result.current.kids[0].presetAmounts).toEqual([5, 10, 20])
    expect(mockFrom).toHaveBeenCalledWith('kids')
  })

  it('sets error when kids fetch fails', async () => {
    enqueue(null, { message: 'DB error' })
    const { result } = renderHook(() => useAllowanceStore('hh1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).not.toBeNull()
    expect(result.current.kids).toEqual([])
  })

  it('loadTransactionsForKid loads and sets transactions', async () => {
    enqueue([]) // initial kids fetch
    const { result } = renderHook(() => useAllowanceStore('hh1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const txRows = [
      {
        id: 't1',
        kid_id: 'k1',
        type: 'credit',
        amount: 10,
        date: '2024-01-15',
        description: 'Allowance',
        added_by_display: null,
      },
    ]
    enqueue(txRows)
    await result.current.loadTransactionsForKid('k1', 30)
    await waitFor(() => {
      expect(result.current.getTransactionsForKid('k1')).toHaveLength(1)
    })
    expect(result.current.getTransactionsForKid('k1')[0].amount).toBe(10)
    expect(result.current.getTransactionsForKid('k1')[0].type).toBe('credit')
  })

  it('addKid inserts and appends to kids', async () => {
    enqueue([]) // initial kids
    const { result } = renderHook(() => useAllowanceStore('hh1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const newKidRow = {
      id: 'k2',
      name: 'Sam',
      allowance_amount: null,
      current_balance: 0,
      preset_amounts: [],
    }
    enqueue(newKidRow)
    await result.current.addKid('Sam')
    await waitFor(() => {
      expect(result.current.kids).toHaveLength(1)
    })
    expect(result.current.kids[0].name).toBe('Sam')
    expect(result.current.kids[0].id).toBe('k2')
  })

  it('getOrCreateViewToken calls rpc and returns token', async () => {
    enqueue([])
    mockRpc.mockResolvedValue({ data: 'view-token-123', error: null })
    const { result } = renderHook(() => useAllowanceStore('hh1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const token = await result.current.getOrCreateViewToken('k1')
    expect(token).toBe('view-token-123')
    expect(mockRpc).toHaveBeenCalledWith('get_or_create_view_token', { p_kid_id: 'k1' })
  })

  it('getOrCreateViewToken returns null and sets error on rpc error', async () => {
    enqueue([])
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })
    const { result } = renderHook(() => useAllowanceStore('hh1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const token = await result.current.getOrCreateViewToken('k1')
    expect(token).toBeNull()
    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })
  })
})
