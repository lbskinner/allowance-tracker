import { describe, it, expect } from 'vitest'
import { formatSignedCurrency } from './formatAmount'

describe('formatSignedCurrency', () => {
  it('formats credit with plus sign', () => {
    expect(formatSignedCurrency('credit', 10)).toBe('+$10.00')
    expect(formatSignedCurrency('credit', 0.5)).toBe('+$0.50')
  })

  it('formats expense with minus sign', () => {
    expect(formatSignedCurrency('expense', 25)).toBe('−$25.00')
    expect(formatSignedCurrency('expense', 1.99)).toBe('−$1.99')
  })

  it('rounds to two decimal places', () => {
    expect(formatSignedCurrency('credit', 10.1)).toBe('+$10.10')
    expect(formatSignedCurrency('credit', 10.999)).toBe('+$11.00')
  })
})
