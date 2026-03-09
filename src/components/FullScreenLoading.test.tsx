import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FullScreenLoading } from './FullScreenLoading'

describe('FullScreenLoading', () => {
  it('renders children', () => {
    render(<FullScreenLoading>Loading…</FullScreenLoading>)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders custom loading text', () => {
    render(<FullScreenLoading>Please wait</FullScreenLoading>)
    expect(screen.getByText('Please wait')).toBeInTheDocument()
  })
})
