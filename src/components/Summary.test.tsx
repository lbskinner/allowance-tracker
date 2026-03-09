import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Summary } from './Summary'
import type { Kid } from '../types/types'

function kid(overrides: Partial<Kid> = {}): Kid {
  return {
    id: 'k1',
    name: 'Alex',
    allowanceAmount: 10,
    presetAmounts: [5, 10],
    currentBalance: 25,
    ...overrides,
  }
}

describe('Summary', () => {
  const noop = vi.fn()

  it('renders heading and kid cards', () => {
    const { container } = render(
      <Summary
        kids={[kid()]}
        onAddTransaction={noop}
        onAddAllowance={noop}
        onConfigureAllowance={noop}
        onGetViewLink={noop}
        onViewTransactions={noop}
        onAddKid={noop}
      />
    )
    expect(within(container).getByRole('heading', { name: /allowance summary/i })).toBeInTheDocument()
    expect(within(container).getByText('Alex')).toBeInTheDocument()
    expect(within(container).getByText('$25.00')).toBeInTheDocument()
  })

  it('calls onAddTransaction with type and kidId when Add credit clicked', async () => {
    const user = userEvent.setup()
    const onAddTransaction = vi.fn()
    const { container } = render(
      <Summary
        kids={[kid()]}
        onAddTransaction={onAddTransaction}
        onAddAllowance={noop}
        onConfigureAllowance={noop}
        onGetViewLink={noop}
        onViewTransactions={noop}
        onAddKid={noop}
      />
    )
    await user.click(within(container).getByRole('button', { name: /add credit/i }))
    expect(onAddTransaction).toHaveBeenCalledWith('credit', 'k1')
  })

  it('calls onAddAllowance when Add allowance button clicked', async () => {
    const user = userEvent.setup()
    const onAddAllowance = vi.fn()
    const { container } = render(
      <Summary
        kids={[kid({ allowanceAmount: 10 })]}
        onAddTransaction={noop}
        onAddAllowance={onAddAllowance}
        onConfigureAllowance={noop}
        onGetViewLink={noop}
        onViewTransactions={noop}
        onAddKid={noop}
      />
    )
    await user.click(within(container).getByRole('button', { name: /add \(\$10\.00\)/i }))
    expect(onAddAllowance).toHaveBeenCalledWith('k1')
  })

  it('does not show Add allowance button when allowanceAmount is null', () => {
    const { container } = render(
      <Summary
        kids={[kid({ allowanceAmount: null })]}
        onAddTransaction={noop}
        onAddAllowance={noop}
        onConfigureAllowance={noop}
        onGetViewLink={noop}
        onViewTransactions={noop}
        onAddKid={noop}
      />
    )
    expect(within(container).queryByRole('button', { name: /add \(\$/i })).not.toBeInTheDocument()
  })

  it('calls onAddKid when Add kid clicked', async () => {
    const user = userEvent.setup()
    const onAddKid = vi.fn()
    const { container } = render(
      <Summary
        kids={[kid()]}
        onAddTransaction={noop}
        onAddAllowance={noop}
        onConfigureAllowance={noop}
        onGetViewLink={noop}
        onViewTransactions={noop}
        onAddKid={onAddKid}
      />
    )
    await user.click(within(container).getByRole('button', { name: /\+ add kid/i }))
    expect(onAddKid).toHaveBeenCalled()
  })

  it('menu opens and Set allowance calls onConfigureAllowance', async () => {
    const user = userEvent.setup()
    const onConfigureAllowance = vi.fn()
    const { container } = render(
      <Summary
        kids={[kid()]}
        onAddTransaction={noop}
        onAddAllowance={noop}
        onConfigureAllowance={onConfigureAllowance}
        onGetViewLink={noop}
        onViewTransactions={noop}
        onAddKid={noop}
      />
    )
    await user.click(within(container).getByRole('button', { name: /more actions for alex/i }))
    await user.click(within(container).getByRole('button', { name: /set allowance/i }))
    expect(onConfigureAllowance).toHaveBeenCalledWith(expect.objectContaining({ id: 'k1', name: 'Alex' }))
  })
})
