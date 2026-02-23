export type TransactionType = 'credit' | 'expense'

export interface Kid {
  id: string
  name: string
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
