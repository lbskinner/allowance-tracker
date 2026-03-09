import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvitePartnerModal } from './InvitePartnerModal'

describe('InvitePartnerModal', () => {
  it('shows loading then code and link when getInviteCode resolves', async () => {
    const getInviteCode = vi.fn().mockResolvedValue('ABC123')
    render(
      <InvitePartnerModal getInviteCode={getInviteCode} onClose={vi.fn()} />
    )
    expect(screen.getByText(/loading code…/i)).toBeInTheDocument()
    expect(getInviteCode).toHaveBeenCalled()
    expect(await screen.findByText('ABC123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
  })

  it('shows error when code is null', async () => {
    const getInviteCode = vi.fn().mockResolvedValue(null)
    render(
      <InvitePartnerModal getInviteCode={getInviteCode} onClose={vi.fn()} />
    )
    expect(await screen.findByText(/could not load invite code/i)).toBeInTheDocument()
  })

  it('calls onClose when Close clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const getInviteCode = vi.fn().mockResolvedValue('X')
    const { container } = render(
      <InvitePartnerModal getInviteCode={getInviteCode} onClose={onClose} />
    )
    await screen.findByText('X')
    const dialog = within(container).getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
