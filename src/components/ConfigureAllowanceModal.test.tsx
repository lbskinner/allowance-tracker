import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigureAllowanceModal } from './ConfigureAllowanceModal'
import type { Kid } from '../types/types'

const mockKid: Kid = {
  id: 'k1',
  name: 'Alex',
  allowanceAmount: 10,
  presetAmounts: [5, 10],
  currentBalance: 0,
}

describe('ConfigureAllowanceModal', () => {
  it('returns null when kid is null', () => {
    const { container } = render(
      <ConfigureAllowanceModal kid={null} onSave={vi.fn()} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders with kid allowance and presets prefilled', () => {
    const { container } = render(
      <ConfigureAllowanceModal
        kid={mockKid}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByRole('heading', { name: /allowance amount for alex/i })).toBeInTheDocument()
    const dialog = within(container).getByRole('dialog')
    const amountInput = within(dialog).getByLabelText(/allowance amount/i)
    expect(amountInput).toHaveValue(10)
    expect(within(dialog).getByLabelText(/quick amount 1/i)).toHaveValue(5)
    expect(within(dialog).getByLabelText(/quick amount 2/i)).toHaveValue(10)
  })

  it('calls onSave with kidId, allowance, and presetAmounts on Save', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const { container } = render(
      <ConfigureAllowanceModal
        kid={mockKid}
        onSave={onSave}
        onClose={onClose}
      />
    )
    const dialog = within(container).getByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/allowance amount/i))
    await user.type(within(dialog).getByLabelText(/allowance amount/i), '12')
    await user.click(within(dialog).getByRole('button', { name: /^save$/i }))
    expect(onSave).toHaveBeenCalledWith('k1', 12, [5, 10])
    expect(onClose).toHaveBeenCalled()
  })

  it('Clear resets amount and presets', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ConfigureAllowanceModal
        kid={mockKid}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    )
    const dialog = within(container).getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^clear$/i }))
    const amountInput = within(dialog).getByRole('spinbutton', { name: /allowance amount/i })
    expect(amountInput.getAttribute('value')).toBe('')
    const preset1 = within(dialog).getByRole('spinbutton', { name: /quick amount 1/i })
    expect(preset1.getAttribute('value')).toBe('')
  })

  it('Cancel calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <ConfigureAllowanceModal
        kid={mockKid}
        onSave={vi.fn()}
        onClose={onClose}
      />
    )
    const dialog = within(container).getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
