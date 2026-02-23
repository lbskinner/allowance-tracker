import { useState, useEffect, useCallback } from 'react'
import type { Kid, Transaction, TransactionType } from './types'
import { useHousehold } from './hooks/useHousehold'
import { supabase } from './lib/supabase'

const db = supabase!

function mapKid(row: { id: string; name: string }): Kid {
  return { id: row.id, name: row.name }
}

function mapTransaction(row: {
  id: string
  kid_id: string
  type: string
  amount: number
  date: string
  description: string
}): Transaction {
  return {
    id: row.id,
    kidId: row.kid_id,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    date: row.date,
    description: row.description ?? '',
  }
}

export function useAllowanceStore() {
  const { householdId, loading: householdLoading, error: householdError } = useHousehold()
  const [kids, setKids] = useState<Kid[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<Error | null>(null)

  const loading = householdLoading || dataLoading
  const error = householdError ?? dataError

  useEffect(() => {
    if (!householdId) {
      queueMicrotask(() => {
        setKids([])
        setTransactions([])
        setDataLoading(false)
      })
      return
    }

    let cancelled = false

    async function fetchData() {
      setDataLoading(true)
      setDataError(null)
      const { data: kidsRows, error: kidsErr } = await db
        .from('kids')
        .select('id, name')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (kidsErr) {
        setDataError(kidsErr as Error)
        setDataLoading(false)
        return
      }

      const kidList = (kidsRows ?? []).map(mapKid)
      setKids(kidList)

      if (kidList.length === 0) {
        setTransactions([])
        setDataLoading(false)
        return
      }

      const kidIds = kidList.map((k) => k.id)
      const { data: txRows, error: txErr } = await db
        .from('transactions')
        .select('id, kid_id, type, amount, date, description')
        .in('kid_id', kidIds)
        .order('date', { ascending: false })

      if (cancelled) return
      if (txErr) {
        setDataError(txErr as Error)
      } else {
        setTransactions((txRows ?? []).map(mapTransaction))
      }
      setDataLoading(false)
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [householdId])

  const addTransaction = useCallback(
    async (kidId: string, type: TransactionType, amount: number, description: string) => {
      const desc = description.trim() || (type === 'credit' ? 'Credit' : 'Expense')
      const { data, error: insertError } = await db
        .from('transactions')
        .insert({
          kid_id: kidId,
          type,
          amount,
          description: desc,
          date: new Date().toISOString(),
        })
        .select('id, kid_id, type, amount, date, description')
        .single()

      if (insertError) {
        setDataError(insertError as Error)
        return
      }
      if (data) {
        setTransactions((prev) => [mapTransaction(data), ...prev])
      }
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

  const addKid = useCallback(
    async (name: string) => {
      if (!householdId) return
      const trimmed = name.trim()
      if (!trimmed) return
      const { data, error: insertError } = await db
        .from('kids')
        .insert({ household_id: householdId, name: trimmed })
        .select('id, name')
        .single()

      if (insertError) {
        setDataError(insertError as Error)
        return
      }
      if (data) {
        setKids((prev) => [...prev, mapKid(data)])
      }
    },
    [householdId]
  )

  return {
    kids,
    transactions,
    addTransaction,
    addKid,
    getBalanceForKid,
    getTransactionsForKid,
    loading,
    error,
  }
}
