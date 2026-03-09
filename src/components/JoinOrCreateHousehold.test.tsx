import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JoinOrCreateHousehold } from './JoinOrCreateHousehold'

describe('JoinOrCreateHousehold', () => {
  it('renders join form and create section', () => {
    const { container } = render(
      <JoinOrCreateHousehold
        onJoin={vi.fn()}
        onCreate={vi.fn()}
        error={null}
      />
    )
    expect(within(container).getByRole('heading', { name: /set up your household/i })).toBeInTheDocument()
    expect(within(container).getByLabelText(/invite code/i)).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: /join household/i })).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: /create new household/i })).toBeInTheDocument()
  })

  it('displays parent error', () => {
    render(
      <JoinOrCreateHousehold
        onJoin={vi.fn()}
        onCreate={vi.fn()}
        error={new Error('Invalid or expired code')}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired code')
  })

  it('join button disabled when code empty', () => {
    const { container } = render(
      <JoinOrCreateHousehold
        onJoin={vi.fn()}
        onCreate={vi.fn()}
        error={null}
      />
    )
    expect(within(container).getByRole('button', { name: /join household/i })).toBeDisabled()
  })

  it('calls onJoin with trimmed code when Join household submitted', async () => {
    const user = userEvent.setup()
    const onJoin = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <JoinOrCreateHousehold
        onJoin={onJoin}
        onCreate={vi.fn()}
        error={null}
      />
    )
    await user.type(within(container).getByLabelText(/invite code/i), '  ABC123  ')
    await user.click(within(container).getByRole('button', { name: /join household/i }))
    expect(onJoin).toHaveBeenCalledWith('ABC123')
  })

  it('uppercases code input', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <JoinOrCreateHousehold
        onJoin={vi.fn()}
        onCreate={vi.fn()}
        error={null}
      />
    )
    const codeInput = within(container).getByLabelText(/invite code/i)
    await user.type(codeInput, 'abc')
    expect(codeInput).toHaveValue('ABC')
  })

  it('calls onCreate when Create new household clicked', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <JoinOrCreateHousehold
        onJoin={vi.fn()}
        onCreate={onCreate}
        error={null}
      />
    )
    await user.click(within(container).getByRole('button', { name: /create new household/i }))
    expect(onCreate).toHaveBeenCalledWith(undefined)
  })

  it('calls onCreate with household name when provided', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <JoinOrCreateHousehold
        onJoin={vi.fn()}
        onCreate={onCreate}
        error={null}
      />
    )
    await user.type(within(container).getByLabelText(/household name/i), 'Smith Family')
    await user.click(within(container).getByRole('button', { name: /create new household/i }))
    expect(onCreate).toHaveBeenCalledWith('Smith Family')
  })
})
