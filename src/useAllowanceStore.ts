import { useState, useEffect, useCallback } from 'react'
import type { Kid, Transaction, TransactionType } from './types'
import { supabase } from './lib/supabase'

const db = supabase!

export type DateRange = 30 | 60 | 90 | 'all'

function mapKid(row: {
  id: string
  name: string
  allowance_amount?: number | null
  current_balance?: number | null
}): Kid {
  return {
    id: row.id,
    name: row.name,
    allowanceAmount: row.allowance_amount != null ? Number(row.allowance_amount) : null,
    currentBalance: row.current_balance != null ? Number(row.current_balance) : 0,
  }
}

function mapTransaction(row: {
  id: string
  kid_id: string
  type: string
  amount: number
  date: string
  description: string
  added_by_display?: string | null
}): Transaction {
  return {
    id: row.id,
    kidId: row.kid_id,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    date: row.date,
    description: row.description ?? '',
    addedByDisplay: row.added_by_display ?? null,
  }
}

function getDateRangeFilter(range: DateRange): { from: string } | null {
  if (range === 'all') return null
  const from = new Date()
  from.setDate(from.getDate() - range)
  from.setHours(0, 0, 0, 0)
  return { from: from.toISOString() }
}

export function useAllowanceStore(householdId: string | null) {
  const [kids, setKids] = useState<Kid[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsKidId, setTransactionsKidId] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [dataError, setDataError] = useState<Error | null>(null)

  useEffect(() => {
    if (!householdId) {
      setKids([])
      setDataLoading(false)
      return
    }

    if (!db) {
      setDataError(new Error('Supabase is not configured'))
      setDataLoading(false)
      return
    }

    let cancelled = false

    async function fetchKids() {
      setDataLoading(true)
      setDataError(null)
      try {
        const { data: kidsRows, error: kidsErr } = await db
          .from('kids')
          .select('id, name, allowance_amount, current_balance')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true })

        if (cancelled) return
        if (kidsErr) {
          setDataError(kidsErr as Error)
          return
        }
        setKids((kidsRows ?? []).map(mapKid))
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false)
        }
      }
    }

    fetchKids()
    return () => {
      cancelled = true
    }
  }, [householdId])

  const [transactionsDateRange, setTransactionsDateRange] = useState<DateRange>(30)

  const loadTransactionsForKid = useCallback(async (kidId: string, range: DateRange) => {
    if (!db) return
    setTransactionsKidId(kidId)
    setTransactionsDateRange(range)
    setTransactionsLoading(true)
    setDataError(null)
    try {
      let query = db
        .from('transactions')
        .select('id, kid_id, type, amount, date, description, added_by_display')
        .eq('kid_id', kidId)
        .order('date', { ascending: false })

      const filter = getDateRangeFilter(range)
      if (filter) {
        query = query.gte('date', filter.from)
      }

      const { data: txRows, error: txErr } = await query

      if (txErr) {
        setDataError(txErr as Error)
        setTransactions([])
      } else {
        setTransactions((txRows ?? []).map(mapTransaction))
      }
    } finally {
      setTransactionsLoading(false)
    }
  }, [])

  const refreshKids = useCallback(async () => {
    if (!householdId || !db) return
    const { data: kidsRows, error: kidsErr } = await db
      .from('kids')
      .select('id, name, allowance_amount, current_balance')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
    if (!kidsErr && kidsRows) setKids(kidsRows.map(mapKid))
  }, [householdId])

  const addTransaction = useCallback(
    async (
      kidId: string,
      type: TransactionType,
      amount: number,
      description: string,
      addedByDisplay?: string | null
    ) => {
      const desc = description.trim() || (type === 'credit' ? 'Credit' : 'Expense')
      const { data, error: insertError } = await db
        .from('transactions')
        .insert({
          kid_id: kidId,
          type,
          amount,
          description: desc,
          date: new Date().toISOString(),
          added_by_display: addedByDisplay ?? null,
        })
        .select('id, kid_id, type, amount, date, description, added_by_display')
        .single()

      if (insertError) {
        setDataError(insertError as Error)
        return
      }
      await refreshKids()
      if (data && transactionsKidId === kidId) {
        await loadTransactionsForKid(kidId, transactionsDateRange)
      }
    },
    [refreshKids, transactionsKidId, transactionsDateRange, loadTransactionsForKid]
  )

  const getTransactionsForKid = useCallback(
    (kidId: string) => {
      return transactionsKidId === kidId ? transactions : []
    },
    [transactionsKidId, transactions]
  )

  const deleteTransaction = useCallback(
    async (transactionId: string) => {
      const { error: deleteError } = await db
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (deleteError) {
        setDataError(deleteError as Error)
        return
      }
      await refreshKids()
      if (transactionsKidId) {
        await loadTransactionsForKid(transactionsKidId, transactionsDateRange)
      }
    },
    [refreshKids, transactionsKidId, transactionsDateRange, loadTransactionsForKid]
  )

  const addKid = useCallback(
    async (name: string) => {
      if (!householdId) return
      const trimmed = name.trim()
      if (!trimmed) return
      const { data, error: insertError } = await db
        .from('kids')
        .insert({ household_id: householdId, name: trimmed })
        .select('id, name, allowance_amount, current_balance')
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

  const updateKidAllowance = useCallback(
    async (kidId: string, amount: number | null) => {
      if (!db) return
      const { error: updateError } = await db
        .from('kids')
        .update({ allowance_amount: amount })
        .eq('id', kidId)

      if (updateError) {
        setDataError(updateError as Error)
        return
      }
      setKids((prev) =>
        prev.map((k) => (k.id === kidId ? { ...k, allowanceAmount: amount } : k))
      )
    },
    []
  )

  const getOrCreateViewToken = useCallback(async (kidId: string): Promise<string | null> => {
    if (!db) return null
    const { data, error: rpcError } = await db.rpc('get_or_create_view_token', {
      p_kid_id: kidId,
    })
    if (rpcError) {
      setDataError(rpcError as Error)
      return null
    }
    return data as string
  }, [])

  return {
    kids,
    addTransaction,
    deleteTransaction,
    addKid,
    updateKidAllowance,
    getOrCreateViewToken,
    getTransactionsForKid,
    loadTransactionsForKid,
    transactionsLoading,
    loading: dataLoading,
    error: dataError,
  }
}
