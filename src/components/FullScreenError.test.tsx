import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FullScreenError } from './FullScreenError'

describe('FullScreenError', () => {
  it('renders the message', () => {
    render(<FullScreenError message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('has app-error class on the message', () => {
    render(<FullScreenError message="Error text" />)
    const el = screen.getByText('Error text')
    expect(el).toHaveClass('app-error')
  })
})
