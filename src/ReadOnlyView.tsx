import { useState, useEffect, useMemo } from 'react'
import type { Transaction, TransactionType } from './types'
import { supabase } from './lib/supabase'
import { runningBalances } from './utils/runningBalances'
import { TransactionListItems } from './TransactionListItems'

interface ReadOnlyViewProps {
  token: string
}

interface ReadOnlyData {
  kidName: string
  kidId: string
  currentBalance: number
  transactions: Array<{
    id: string
    kid_id: string
    type: string
    amount: number
    date: string
    description: string
    added_by_display?: string | null
  }>
}

export function ReadOnlyView({ token }: ReadOnlyViewProps) {
  const [data, setData] = useState<ReadOnlyData | null>(null)
  const [loading, setLoading] = useState(!!supabase)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase
      .rpc('get_readonly_view', { p_token: token })
      .then(({ data: result, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }
        if (result == null) {
          setError('Invalid or expired link.')
          setLoading(false)
          return
        }
        setData(result as ReadOnlyData)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const transactions: Transaction[] = useMemo(
    () =>
      (data?.transactions ?? []).map((t) => ({
        id: t.id,
        kidId: t.kid_id,
        type: t.type as TransactionType,
        amount: Number(t.amount),
        date: t.date,
        description: t.description ?? '',
        addedByDisplay: t.added_by_display ?? null,
      })),
    [data?.transactions]
  )
  const byDateNewestFirst = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  )
  const currentBalance = data?.currentBalance ?? 0
  const balances = useMemo(
    () => runningBalances(transactions, currentBalance),
    [transactions, currentBalance]
  )

  if (loading) {
    return (
      <div className="app app-loading">
        <p>Loading…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="app">
        <div className="readonly-view readonly-view-error">
          <h1>Allowance Tracker</h1>
          <p className="app-error">{error ?? 'Invalid or expired link.'}</p>
          <p className="readonly-view-hint">Ask your parent for a new view link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="readonly-view">
        <header className="readonly-view-header">
          <h1>My allowance – {data.kidName}</h1>
          <p className="readonly-view-sub">Read-only · Last 30 days</p>
          <p className="readonly-view-balance" data-negative={data.currentBalance < 0}>
            Current balance: ${data.currentBalance.toFixed(2)}
          </p>
        </header>
        <main className="readonly-view-main">
          {byDateNewestFirst.length === 0 ? (
            <p className="empty-state">No transactions in the last 30 days.</p>
          ) : (
            <TransactionListItems
              transactions={byDateNewestFirst}
              balances={balances}
              listClassName="transaction-list readonly-transaction-list"
            />
          )}
        </main>
      </div>
    </div>
  )
}
