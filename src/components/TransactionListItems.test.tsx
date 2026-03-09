import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionListItems } from './TransactionListItems'
import type { Transaction } from '../types/types'

function tx(
  id: string,
  type: 'credit' | 'expense',
  amount: number,
  date: string,
  description = ''
): Transaction {
  return { id, kidId: 'k1', type, amount, date, description }
}

describe('TransactionListItems', () => {
  it('returns null when transactions is empty', () => {
    const { container } = render(
      <TransactionListItems transactions={[]} balances={new Map()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders transaction amount, date, and running total', () => {
    const transactions = [tx('t1', 'credit', 10, '2024-01-15T12:00:00Z')]
    const balances = new Map([['t1', 10]])
    const { container } = render(
      <TransactionListItems transactions={transactions} balances={balances} />
    )
    expect(within(container).getByText('+$10.00')).toBeInTheDocument()
    expect(within(container).getByText(/Running total: \$10\.00/)).toBeInTheDocument()
  })

  it('shows description when present', () => {
    const transactions = [
      tx('t1', 'credit', 5, '2024-01-01Z', 'Weekly allowance'),
    ]
    const { container } = render(
      <TransactionListItems
        transactions={transactions}
        balances={new Map([['t1', 5]])}
      />
    )
    expect(within(container).getByText('Weekly allowance')).toBeInTheDocument()
  })

  it('when onDelete provided, shows Delete button and confirms before delete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const transactions = [tx('t1', 'expense', 3, '2024-01-01Z')]
    const { container } = render(
      <TransactionListItems
        transactions={transactions}
        balances={new Map([['t1', 2]])}
        onDelete={onDelete}
      />
    )
    await user.click(within(container).getByRole('button', { name: /delete transaction/i }))
    expect(within(container).getByText(/delete\?/i)).toBeInTheDocument()
    await user.click(within(container).getByRole('button', { name: /^yes$/i }))
    expect(onDelete).toHaveBeenCalledWith('t1')
  })

  it('Cancel in delete confirm hides confirm and does not call onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const transactions = [tx('t1', 'credit', 1, '2024-01-01Z')]
    const { container } = render(
      <TransactionListItems
        transactions={transactions}
        balances={new Map([['t1', 1]])}
        onDelete={onDelete}
      />
    )
    await user.click(within(container).getByRole('button', { name: /delete transaction/i }))
    await user.click(within(container).getByRole('button', { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
