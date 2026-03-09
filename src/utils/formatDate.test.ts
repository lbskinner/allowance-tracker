import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('returns a non-empty string for valid ISO date', () => {
    const result = formatDate('2024-01-15T12:00:00.000Z')
   expect(result).toBe('Jan 15, 2024')
  })

  it('does not throw for valid ISO-like strings', () => {
    expect(() => formatDate('2024-01-15')).not.toThrow()
    expect(() => formatDate('2024-01-15T00:00:00Z')).not.toThrow()
  })
})
