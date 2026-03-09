import type { TransactionType } from '../types/types'

export function formatSignedCurrency(type: TransactionType, amount: number): string {
  const sign = type === 'credit' ? '+' : '−'
  return `${sign}$${amount.toFixed(2)}`
}

