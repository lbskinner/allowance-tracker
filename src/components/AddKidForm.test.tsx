import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddKidForm } from './AddKidForm'

describe('AddKidForm', () => {
  it('renders name input and buttons', () => {
    const { container } = render(<AddKidForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(within(container).getByLabelText(/kid name/i)).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: /add kid/i })).toBeInTheDocument()
    expect(within(container).getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const { container } = render(<AddKidForm onSubmit={vi.fn()} onCancel={onCancel} />)
    await user.click(within(container).getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('submits trimmed name and calls onCancel on success', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onCancel = vi.fn()
    const { container } = render(<AddKidForm onSubmit={onSubmit} onCancel={onCancel} />)
    await user.type(within(container).getByLabelText(/kid name/i), '  Alex  ')
    await user.click(within(container).getByRole('button', { name: /add kid/i }))
    expect(onSubmit).toHaveBeenCalledWith('Alex')
    expect(onCancel).toHaveBeenCalled()
  })

  it('submit button is disabled when name is empty', () => {
    const { container } = render(<AddKidForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(within(container).getByRole('button', { name: /add kid/i })).toBeDisabled()
  })
})
