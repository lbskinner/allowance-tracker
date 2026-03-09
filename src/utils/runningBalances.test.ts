import { describe, it, expect } from 'vitest'
import { runningBalances } from './runningBalances'
import type { Transaction } from '../types/types'

function tx(
  id: string,
  type: 'credit' | 'expense',
  amount: number,
  date: string
): Transaction {
  return {
    id,
    kidId: 'kid1',
    type,
    amount,
    date,
    description: '',
  }
}

describe('runningBalances', () => {
  it('returns empty map when no transactions', () => {
    const result = runningBalances([], 100)
    expect(result.size).toBe(0)
  })

  it('computes running balance for a single credit', () => {
    const t = tx('a', 'credit', 10, '2024-01-01T00:00:00Z')
    const result = runningBalances([t], 10)
    expect(result.get('a')).toBe(10)
  })

  it('computes running balance for a single expense', () => {
    const t = tx('a', 'expense', 5, '2024-01-01T00:00:00Z')
    const result = runningBalances([t], 5)
    expect(result.get('a')).toBe(5)
  })

  it('walks backward from current balance (newest first)', () => {
    const newest = tx('n', 'expense', 5, '2024-01-03T00:00:00Z')
    const older = tx('o', 'credit', 20, '2024-01-02T00:00:00Z')
    const oldest = tx('p', 'credit', 10, '2024-01-01T00:00:00Z')
    const result = runningBalances([oldest, older, newest], 25)
    expect(result.get('n')).toBe(25)
    expect(result.get('o')).toBe(30)
    expect(result.get('p')).toBe(10)
  })

  it('sorts by date newest first when input is unsorted', () => {
    const a = tx('a', 'credit', 10, '2024-01-01T00:00:00Z')
    const b = tx('b', 'credit', 5, '2024-01-02T00:00:00Z')
    const result = runningBalances([a, b], 15)
    expect(result.get('b')).toBe(15)
    expect(result.get('a')).toBe(10)
  })

  it('handles negative balance', () => {
    const t = tx('a', 'expense', 10, '2024-01-01T00:00:00Z')
    const result = runningBalances([t], -5)
    expect(result.get('a')).toBe(-5)
  })
})
