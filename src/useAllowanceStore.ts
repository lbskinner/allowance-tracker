import { useState, useEffect, useCallback } from 'react'
import type { Kid, Transaction, TransactionType } from './types'

const STORAGE_KEY = 'allowance-tracker-data'

const defaultData = {
  kids: [
    { id: '1', name: 'Alex' },
    { id: '2', name: 'Sam' },
  ] as Kid[],
  transactions: [] as Transaction[],
}

function loadData(): { kids: Kid[]; transactions: Transaction[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { kids: Kid[]; transactions: Transaction[] }
      if (Array.isArray(parsed.kids) && Array.isArray(parsed.transactions)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return { ...defaultData }
}

function saveData(kids: Kid[], transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ kids, transactions }))
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useAllowanceStore() {
  const [kids, setKids] = useState<Kid[]>(() => loadData().kids)
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadData().transactions)

  useEffect(() => {
    saveData(kids, transactions)
  }, [kids, transactions])

  const addTransaction = useCallback(
    (kidId: string, type: TransactionType, amount: number, description: string) => {
      const transaction: Transaction = {
        id: generateId(),
        kidId,
        type,
        amount,
        date: new Date().toISOString(),
        description: description.trim() || (type === 'credit' ? 'Credit' : 'Expense'),
      }
      setTransactions((prev) => [transaction, ...prev])
    },
    []
  )

  const getBalanceForKid = useCallback(
    (kidId: string) => {
      return transactions
        .filter((t) => t.kidId === kidId)
        .reduce((sum, t) => (t.type === 'credit' ? sum + t.amount : sum - t.amount), 0)
    },
    [transactions]
  )

  const getTransactionsForKid = useCallback(
    (kidId: string) => {
      return transactions.filter((t) => t.kidId === kidId)
    },
    [transactions]
  )

  return {
    kids,
    transactions,
    addTransaction,
    getBalanceForKid,
    getTransactionsForKid,
  }
}
