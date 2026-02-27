import type { Transaction } from '../types/types'

/**
 * Running balance after each transaction, computed backward from currentBalance.
 * Transactions are processed newest-first; each row gets the balance after that transaction.
 */
export function runningBalances(
  transactions: Transaction[],
  currentBalance: number
): Map<string, number> {
  const map = new Map<string, number>()
  const byDateNewestFirst = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  let balance = currentBalance
  for (const t of byDateNewestFirst) {
    map.set(t.id, balance)
    balance -= t.type === 'credit' ? t.amount : -t.amount
  }
  return map
}
