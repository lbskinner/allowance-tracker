export type TransactionType = 'credit' | 'expense'

export interface Kid {
  id: string
  name: string
  /** Configured allowance amount for "Add allowance" shortcut; null if not set */
  allowanceAmount: number | null
  /** Current balance (credits − expenses); kept in sync by DB trigger */
  currentBalance: number
}

export interface Transaction {
  id: string
  kidId: string
  type: TransactionType
  amount: number
  date: string // ISO date string
  description: string
}

export interface AllowanceData {
  kids: Kid[]
  transactions: Transaction[]
}
