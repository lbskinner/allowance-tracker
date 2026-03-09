import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { Kid } from './types/types'

const mockSignOut = vi.fn()
const mockCreateHousehold = vi.fn()
const mockJoinHouseholdByCode = vi.fn()
const mockGetInviteCode = vi.fn()
const mockAddTransaction = vi.fn()
const mockDeleteTransaction = vi.fn()
const mockAddKid = vi.fn()
const mockUpdateKidSettings = vi.fn()
const mockGetOrCreateViewToken = vi.fn()
const mockLoadTransactionsForKid = vi.fn()

const { mockUseAuth, mockUseHousehold, mockUseAllowanceStore } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseHousehold: vi.fn(),
  mockUseAllowanceStore: vi.fn(),
}))

vi.mock('./contexts/useAuth', () => ({ useAuth: () => mockUseAuth() }))
vi.mock('./hooks/useHousehold', () => ({ useHousehold: () => mockUseHousehold() }))
vi.mock('./hooks/useAllowanceStore', () => ({ useAllowanceStore: () => mockUseAllowanceStore() }))

function mockKid(overrides: Partial<Kid> = {}): Kid {
  return {
    id: 'k1',
    name: 'Alex',
    allowanceAmount: 10,
    presetAmounts: [5, 10],
    currentBalance: 25,
    ...overrides,
  }
}

function setupLoadedApp() {
  mockUseAuth.mockReturnValue({
    session: { user: { email: 'parent@example.com' } },
    loading: false,
    signOut: mockSignOut,
  })
  mockUseHousehold.mockReturnValue({
    householdId: 'hh1',
    householdName: 'My House',
    loading: false,
    error: null,
    createHousehold: mockCreateHousehold,
    joinHouseholdByCode: mockJoinHouseholdByCode,
    getInviteCode: mockGetInviteCode,
  })
  mockUseAllowanceStore.mockReturnValue({
    kids: [mockKid()],
    addTransaction: mockAddTransaction,
    deleteTransaction: mockDeleteTransaction,
    addKid: mockAddKid,
    updateKidSettings: mockUpdateKidSettings,
    getOrCreateViewToken: mockGetOrCreateViewToken,
    getTransactionsForKid: () => [],
    loadTransactionsForKid: mockLoadTransactionsForKid,
    transactionsLoading: false,
    loading: false,
    error: null,
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows FullScreenLoading when auth is loading', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true, signOut: mockSignOut })
    mockUseHousehold.mockReturnValue({
      householdId: null,
      householdName: null,
      loading: false,
      error: null,
      createHousehold: vi.fn(),
      joinHouseholdByCode: vi.fn(),
      getInviteCode: vi.fn(),
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows AuthScreen when there is no session', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false, signOut: mockSignOut })
    mockUseHousehold.mockReturnValue({
      householdId: null,
      householdName: null,
      loading: false,
      error: null,
      createHousehold: vi.fn(),
      joinHouseholdByCode: vi.fn(),
      getInviteCode: vi.fn(),
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    expect(screen.getByRole('heading', { name: /allowance tracker/i })).toBeInTheDocument()
    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument()
  })

  it('shows FullScreenLoading when household is loading', () => {
    mockUseAuth.mockReturnValue({
      session: { user: {} },
      loading: false,
      signOut: mockSignOut,
    })
    mockUseHousehold.mockReturnValue({
      householdId: null,
      householdName: null,
      loading: true,
      error: null,
      createHousehold: vi.fn(),
      joinHouseholdByCode: vi.fn(),
      getInviteCode: vi.fn(),
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows JoinOrCreateHousehold when no household and not loading', () => {
    mockUseAuth.mockReturnValue({
      session: { user: {} },
      loading: false,
      signOut: mockSignOut,
    })
    mockUseHousehold.mockReturnValue({
      householdId: null,
      householdName: null,
      loading: false,
      error: null,
      createHousehold: mockCreateHousehold,
      joinHouseholdByCode: mockJoinHouseholdByCode,
      getInviteCode: mockGetInviteCode,
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    expect(screen.getByRole('heading', { name: /allowance tracker/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /set up your household/i })).toBeInTheDocument()
  })

  it('calls signOut when Sign out clicked on no-household screen', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: {} },
      loading: false,
      signOut: mockSignOut,
    })
    mockUseHousehold.mockReturnValue({
      householdId: null,
      householdName: null,
      loading: false,
      error: null,
      createHousehold: vi.fn(),
      joinHouseholdByCode: vi.fn(),
      getInviteCode: vi.fn(),
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('shows FullScreenLoading when data is loading after household exists', () => {
    mockUseAuth.mockReturnValue({
      session: { user: {} },
      loading: false,
      signOut: mockSignOut,
    })
    mockUseHousehold.mockReturnValue({
      householdId: 'hh1',
      householdName: 'My House',
      loading: false,
      error: null,
      createHousehold: vi.fn(),
      joinHouseholdByCode: vi.fn(),
      getInviteCode: vi.fn(),
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: true,
      error: null,
    })
    render(<App />)
    expect(screen.getByText('Loading your data…')).toBeInTheDocument()
  })

  it('shows FullScreenError when there is an error', () => {
    mockUseAuth.mockReturnValue({
      session: { user: {} },
      loading: false,
      signOut: mockSignOut,
    })
    mockUseHousehold.mockReturnValue({
      householdId: 'hh1',
      householdName: null,
      loading: false,
      error: new Error('Household failed'),
      createHousehold: vi.fn(),
      joinHouseholdByCode: vi.fn(),
      getInviteCode: vi.fn(),
    })
    mockUseAllowanceStore.mockReturnValue({
      kids: [],
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addKid: vi.fn(),
      updateKidSettings: vi.fn(),
      getOrCreateViewToken: vi.fn(),
      getTransactionsForKid: () => [],
      loadTransactionsForKid: vi.fn(),
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    expect(screen.getByText(/something went wrong: household failed/i)).toBeInTheDocument()
  })

  it('shows main app with header, household name, and Summary when loaded', () => {
    setupLoadedApp()
    render(<App />)
    expect(screen.getByRole('heading', { name: /allowance tracker/i })).toBeInTheDocument()
    expect(screen.getByText('My House')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /invite partner/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /allowance summary/i })).toBeInTheDocument()
    expect(screen.getByText('Alex')).toBeInTheDocument()
  })

  it('opens InvitePartnerModal when Invite partner clicked', async () => {
    setupLoadedApp()
    mockGetInviteCode.mockResolvedValue('INVITE-CODE')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /invite partner/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(mockGetInviteCode).toHaveBeenCalled()
  })

  it('switches to add kid view when Add kid is clicked from Summary', async () => {
    setupLoadedApp()
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /add kid/i }))
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('switches to add transaction view when Add credit is clicked', async () => {
    setupLoadedApp()
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /add credit/i }))
    expect(screen.getByRole('heading', { name: /add credit/i })).toBeInTheDocument()
  })

  it('switches to transactions view when View transactions is clicked', async () => {
    setupLoadedApp()
    mockUseAllowanceStore.mockReturnValue({
      kids: [mockKid()],
      addTransaction: mockAddTransaction,
      deleteTransaction: mockDeleteTransaction,
      addKid: mockAddKid,
      updateKidSettings: mockUpdateKidSettings,
      getOrCreateViewToken: mockGetOrCreateViewToken,
      getTransactionsForKid: () => [],
      loadTransactionsForKid: mockLoadTransactionsForKid,
      transactionsLoading: false,
      loading: false,
      error: null,
    })
    render(<App />)
    const viewTxButton = screen.getByRole('button', { name: /view transactions/i })
    await userEvent.click(viewTxButton)
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('calls signOut when Sign out clicked in main app', async () => {
    setupLoadedApp()
    render(<App />)
    const signOutButtons = screen.getAllByRole('button', { name: /sign out/i })
    await userEvent.click(signOutButtons[0])
    expect(mockSignOut).toHaveBeenCalled()
  })
})
