import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthScreen } from './AuthScreen'

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
  }),
}))

describe('AuthScreen', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockSignUp.mockReset()
  })

  it('renders sign in form by default', () => {
    const { container } = render(<AuthScreen />)
    expect(within(container).getByRole('heading', { name: /allowance tracker/i })).toBeInTheDocument()
    expect(within(container).getByText(/sign in to continue/i)).toBeInTheDocument()
    const form = container.querySelector('form')!
    expect(within(form).getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('switches to sign up tab', async () => {
    const user = userEvent.setup()
    const { container } = render(<AuthScreen />)
    const signUpTab = within(container).getAllByRole('button', { name: /sign up/i })[0]
    await user.click(signUpTab)
    expect(within(container).getByText(/create an account/i)).toBeInTheDocument()
    expect(signUpTab).toHaveClass('active')
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    const { container } = render(<AuthScreen />)
    await user.type(within(container).getByPlaceholderText(/you@example\.com/i), 'notanemail')
    await user.type(within(container).getByPlaceholderText(/••••••••/), 'password1')
    const form = container.querySelector('form')!
    form.noValidate = true
    await user.click(within(form).getByRole('button', { name: /sign in/i }))
    const alert = await within(container).findByRole('alert')
    expect(alert).toHaveTextContent(/valid email/i)
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    const { container } = render(<AuthScreen />)
    await user.type(within(container).getByPlaceholderText(/you@example\.com/i), 'a@b.co')
    await user.type(within(container).getByPlaceholderText(/••••••••/), '12345')
    const form = container.querySelector('form')!
    await user.click(within(form).getByRole('button', { name: /sign in/i }))
    expect(within(container).getByRole('alert')).toHaveTextContent(/at least 6 characters/i)
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('calls signIn when sign in form submitted with valid data', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    const { container } = render(<AuthScreen />)
    await user.type(within(container).getByPlaceholderText(/you@example\.com/i), 'a@b.co')
    await user.type(within(container).getByPlaceholderText(/••••••••/), 'password1')
    const form = container.querySelector('form')!
    await user.click(within(form).getByRole('button', { name: /sign in/i }))
    expect(mockSignIn).toHaveBeenCalledWith('a@b.co', 'password1')
  })

  it('calls signUp when sign up tab and form submitted', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    const { container } = render(<AuthScreen />)
    await user.click(within(container).getAllByRole('button', { name: /sign up/i })[0])
    await user.type(within(container).getByPlaceholderText(/you@example\.com/i), 'a@b.co')
    await user.type(within(container).getByPlaceholderText(/••••••••/), 'password1')
    const form = container.querySelector('form')!
    await user.click(within(form).getByRole('button', { name: /sign up/i }))
    expect(mockSignUp).toHaveBeenCalledWith('a@b.co', 'password1')
  })
})
