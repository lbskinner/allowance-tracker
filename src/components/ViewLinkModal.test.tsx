import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewLinkModal } from './ViewLinkModal'
import type { Kid } from '../types/types'

const mockKid: Kid = {
  id: 'k1',
  name: 'Alex',
  allowanceAmount: null,
  presetAmounts: [],
  currentBalance: 0,
}

describe('ViewLinkModal', () => {

  it('shows loading then view URL when getOrCreateViewToken resolves', async () => {
    const getOrCreateViewToken = vi.fn().mockResolvedValue('token-123')
    const { container } = render(
      <ViewLinkModal
        kid={mockKid}
        getOrCreateViewToken={getOrCreateViewToken}
        onClose={vi.fn()}
      />
    )
    expect(within(container).getByText(/loading…/i)).toBeInTheDocument()
    expect(getOrCreateViewToken).toHaveBeenCalledWith('k1')
    const input = await within(container).findByDisplayValue(/\/view\/token-123/)
    expect(input).toBeInTheDocument()
  })

  it('shows error when token is null', async () => {
    const getOrCreateViewToken = vi.fn().mockResolvedValue(null)
    const { container } = render(
      <ViewLinkModal
        kid={mockKid}
        getOrCreateViewToken={getOrCreateViewToken}
        onClose={vi.fn()}
      />
    )
    expect(await within(container).findByText(/could not load the view link/i)).toBeInTheDocument()
  })

  it('calls onClose when Close clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const getOrCreateViewToken = vi.fn().mockResolvedValue('t')
    const { container } = render(
      <ViewLinkModal
        kid={mockKid}
        getOrCreateViewToken={getOrCreateViewToken}
        onClose={onClose}
      />
    )
    const dialog = within(container).getByRole('dialog')
    await within(dialog).findByRole('textbox', { name: /view link/i })
    await user.click(within(dialog).getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('has dialog title for kid name', async () => {
    const getOrCreateViewToken = vi.fn().mockResolvedValue('t')
    const { container } = render(
      <ViewLinkModal
        kid={mockKid}
        getOrCreateViewToken={getOrCreateViewToken}
        onClose={vi.fn()}
      />
    )
    const dialog = within(container).getByRole('dialog')
    await within(dialog).findByRole('textbox', { name: /view link/i })
    expect(dialog).toHaveAttribute('aria-labelledby', 'view-link-modal-title')
    expect(within(dialog).getByText(/view link for alex/i)).toBeInTheDocument()
  })
})
