import { describe, it, expect } from 'vitest'
import { getDisplayNameFromEmail } from './displayName'

describe('getDisplayNameFromEmail', () => {
  it('returns empty string for null or undefined', () => {
    expect(getDisplayNameFromEmail(null)).toBe('')
    expect(getDisplayNameFromEmail(undefined)).toBe('')
  })

  it('returns part before @ for valid email', () => {
    expect(getDisplayNameFromEmail('alice@example.com')).toBe('alice')
    expect(getDisplayNameFromEmail('bob.smith@test.org')).toBe('bob.smith')
  })

  it('returns full string when no @', () => {
    expect(getDisplayNameFromEmail('no-at-sign')).toBe('no-at-sign')
  })

  it('returns empty string for empty input', () => {
    expect(getDisplayNameFromEmail('')).toBe('')
  })
})
