import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHousehold } from './useHousehold'

const { mockFrom, mockRpc, mockUseAuth } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockUseAuth: vi.fn(() => ({ session: null } as { session: { user: { id: string } } | null })),
}))

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
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

const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockImplementation(() => nextThenable()),
  single: vi.fn().mockImplementation(() => nextThenable()),
}

describe('useHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    promiseQueue.length = 0
    mockUseAuth.mockReturnValue({ session: null })
    mockFrom.mockReturnValue(chain)
  })

  it('returns null household and loading false when session is null', async () => {
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.householdId).toBeNull()
    expect(result.current.householdName).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('fetches household id and name when session is set', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue([{ household_id: 'hh1' }]) // household_members
    enqueue({ name: 'My House' }) // households.single()
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.householdId).toBe('hh1')
    expect(result.current.householdName).toBe('My House')
    expect(mockFrom).toHaveBeenCalledWith('household_members')
    expect(mockFrom).toHaveBeenCalledWith('households')
  })

  it('sets null household when user has no members', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue([])
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.householdId).toBeNull()
    expect(result.current.householdName).toBeNull()
  })

  it('sets error when household_members fetch fails', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue(null, { message: 'DB error' })
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).not.toBeNull()
    expect(result.current.householdId).toBeNull()
  })

  it('createHousehold calls rpc and refreshes', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue([{ household_id: 'hh1' }])
    enqueue({ name: 'My House' })
    mockRpc.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    enqueue([{ household_id: 'hh2' }])
    enqueue({ name: 'New House' })
    await result.current.createHousehold('New House')
    expect(mockRpc).toHaveBeenCalledWith('create_household_for_current_user', { p_name: 'New House' })
    await waitFor(() => {
      expect(result.current.householdId).toBe('hh2')
      expect(result.current.householdName).toBe('New House')
    })
  })

  it('joinHouseholdByCode calls rpc with trimmed code and refreshes', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue([])
    mockRpc.mockResolvedValue({ data: 'hh-joined', error: null })
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    enqueue([{ household_id: 'hh-joined' }])
    enqueue({ name: 'Joined House' })
    await result.current.joinHouseholdByCode('  ABC123  ')
    expect(mockRpc).toHaveBeenCalledWith('join_household_by_code', { p_code: 'ABC123' })
    await waitFor(() => {
      expect(result.current.householdId).toBe('hh-joined')
    })
  })

  it('getInviteCode calls rpc and returns code', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue([{ household_id: 'hh1' }])
    enqueue({ name: 'House' })
    mockRpc.mockResolvedValue({ data: 'INVITE-CODE', error: null })
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const code = await result.current.getInviteCode()
    expect(code).toBe('INVITE-CODE')
    expect(mockRpc).toHaveBeenCalledWith('get_or_create_invite_code', { p_household_id: 'hh1' })
  })

  it('getInviteCode returns null when no householdId', async () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'user1' } } } as any)
    enqueue([])
    const { result } = renderHook(() => useHousehold())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const code = await result.current.getInviteCode()
    expect(code).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })
})
