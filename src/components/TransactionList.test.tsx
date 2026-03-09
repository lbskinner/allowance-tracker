import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionList } from './TransactionList'
import type { Kid, Transaction } from '../types/types'

function kid(overrides: Partial<Kid> = {}): Kid {
  return {
    id: 'k1',
    name: 'Alex',
    allowanceAmount: null,
    presetAmounts: [],
    currentBalance: 0,
    ...overrides,
  }
}

function tx(id: string, type: 'credit' | 'expense', amount: number, date: string): Transaction {
  return { id, kidId: 'k1', type, amount, date, description: '' }
}

describe('TransactionList', () => {
  it('returns null when kid is null', () => {
    const { container } = render(
      <TransactionList
        kid={null}
        transactions={[]}
        transactionsLoading={false}
        onBack={vi.fn()}
        onDeleteTransaction={vi.fn()}
        loadTransactionsForKid={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders kid name and back button', () => {
    const loadTransactionsForKid = vi.fn()
    const { container } = render(
      <TransactionList
        kid={kid()}
        transactions={[]}
        transactionsLoading={false}
        onBack={vi.fn()}
        onDeleteTransaction={vi.fn()}
        loadTransactionsForKid={loadTransactionsForKid}
      />
    )
    expect(within(container).getByRole('heading', { name: /transactions – alex/i })).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: /back to summary/i })).toBeInTheDocument()
    expect(loadTransactionsForKid).toHaveBeenCalledWith('k1', 30)
  })

  it('calls onBack when Back clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { container } = render(
      <TransactionList
        kid={kid()}
        transactions={[]}
        transactionsLoading={false}
        onBack={onBack}
        onDeleteTransaction={vi.fn()}
        loadTransactionsForKid={vi.fn()}
      />
    )
    await user.click(within(container).getByRole('button', { name: /back to summary/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    const { container } = render(
      <TransactionList
        kid={kid()}
        transactions={[]}
        transactionsLoading={true}
        onBack={vi.fn()}
        onDeleteTransaction={vi.fn()}
        loadTransactionsForKid={vi.fn()}
      />
    )
    expect(within(container).getByText(/loading…/i)).toBeInTheDocument()
  })

  it('shows empty state when no transactions', () => {
    const { container } = render(
      <TransactionList
        kid={kid()}
        transactions={[]}
        transactionsLoading={false}
        onBack={vi.fn()}
        onDeleteTransaction={vi.fn()}
        loadTransactionsForKid={vi.fn()}
      />
    )
    expect(within(container).getByText(/no transactions in this range/i)).toBeInTheDocument()
  })

  it('renders transactions via TransactionListItems', () => {
    const transactions = [tx('t1', 'credit', 10, '2024-01-15T00:00:00Z')]
    const { container } = render(
      <TransactionList
        kid={kid({ currentBalance: 10 })}
        transactions={transactions}
        transactionsLoading={false}
        onBack={vi.fn()}
        onDeleteTransaction={vi.fn()}
        loadTransactionsForKid={vi.fn()}
      />
    )
    expect(within(container).getByText('+$10.00')).toBeInTheDocument()
  })
})
