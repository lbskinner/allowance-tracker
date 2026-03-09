import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTransactionForm } from './AddTransactionForm'
import type { Kid } from '../types/types'

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

describe('AddTransactionForm', () => {
  it('shows empty state when no kids', () => {
    render(
      <AddTransactionForm
        kids={[]}
        selectedKidId={null}
        type="credit"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText(/add a kid before recording transactions/i)).toBeInTheDocument()
  })

  it('renders form with kid select and amount when kids provided', () => {
    render(
      <AddTransactionForm
        kids={[kid()]}
        selectedKidId={null}
        type="credit"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/select kid/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add credit/i })).toBeInTheDocument()
  })

  it('shows Add expense label for expense type', () => {
    render(
      <AddTransactionForm
        kids={[kid()]}
        selectedKidId={null}
        type="expense"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('heading', { name: /add expense/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
  })

  it('submits with kidId, type, amount, and description', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(
      <AddTransactionForm
        kids={[kid()]}
        selectedKidId={null}
        type="credit"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.type(within(container).getByRole('spinbutton', { name: /amount/i }), '15.50')
    await user.type(within(container).getByLabelText(/description/i), 'Allowance')
    await user.click(within(container).getByRole('button', { name: /add credit/i }))
    expect(onSubmit).toHaveBeenCalledWith('k1', 'credit', 15.5, 'Allowance')
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows quick amount buttons for credit when kid has presetAmounts', () => {
    render(
      <AddTransactionForm
        kids={[kid({ presetAmounts: [5, 10] })]}
        selectedKidId={null}
        type="credit"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /\$5/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\$10/i })).toBeInTheDocument()
  })

  it('calls onCancel when Cancel clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const { container } = render(
      <AddTransactionForm
        kids={[kid()]}
        selectedKidId={null}
        type="credit"
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    )
    await user.click(within(container).getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
