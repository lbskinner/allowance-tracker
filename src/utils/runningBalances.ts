import type { Transaction } from '../types'

/**
 * Running balance after each transaction (forward from 0).
 * Use when you don't have a known current balance (e.g. read-only view with no total).
 */
export function runningBalances(transactions: Transaction[]): Map<string, number>

/**
 * Running balance after each transaction, computed backward from currentBalance.
 * Use when showing a date range so "Total after this" is the true balance.
 */
export function runningBalances(
  transactions: Transaction[],
  currentBalance: number
): Map<string, number>

export function runningBalances(
  transactions: Transaction[],
  currentBalance?: number
): Map<string, number> {
  const map = new Map<string, number>()
  const byDateNewestFirst = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (currentBalance !== undefined) {
    let balance = currentBalance
    for (const t of byDateNewestFirst) {
      map.set(t.id, balance)
      balance -= t.type === 'credit' ? t.amount : -t.amount
    }
  } else {
    const byDateOldestFirst = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    let balance = 0
    for (const t of byDateOldestFirst) {
      balance += t.type === 'credit' ? t.amount : -t.amount
      map.set(t.id, balance)
    }
  }
  return map
}
