import { useState, useMemo, useEffect } from 'react'
import type { Kid, Transaction } from './types'
import type { DateRange } from './useAllowanceStore'
import { runningBalances } from './utils/runningBalances'
import { TransactionListItems } from './TransactionListItems'

interface TransactionListProps {
  kid: Kid | null
  transactions: Transaction[]
  transactionsLoading: boolean
  onBack: () => void
  onDeleteTransaction: (transactionId: string) => void
  loadTransactionsForKid: (kidId: string, range: DateRange) => void
}

export function TransactionList({
  kid,
  transactions,
  transactionsLoading,
  onBack,
  onDeleteTransaction,
  loadTransactionsForKid,
}: TransactionListProps) {
  const [dateRange, setDateRange] = useState<DateRange>(30)

  useEffect(() => {
    if (kid) loadTransactionsForKid(kid.id, dateRange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid?.id, dateRange, loadTransactionsForKid])

  const byDateNewestFirst = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  )
  const balances = useMemo(
    () => runningBalances(transactions, kid?.currentBalance ?? 0),
    [transactions, kid?.currentBalance]
  )

  if (!kid) return null

  return (
    <section className="transaction-list-section">
      <div className="transaction-list-header">
        <h2>Transactions – {kid.name}</h2>
        <button type="button" onClick={onBack} className="back secondary">
          ← Back to summary
        </button>
      </div>
      <div className="transaction-filter">
        <label htmlFor="transaction-date-range">Show:</label>
        <select
          id="transaction-date-range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          aria-label="Filter by date range"
        >
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
          <option value="all">All</option>
        </select>
      </div>
      {transactionsLoading ? (
        <p className="empty-state">Loading…</p>
      ) : byDateNewestFirst.length === 0 ? (
        <p className="empty-state">No transactions in this range.</p>
      ) : (
        <TransactionListItems
          transactions={byDateNewestFirst}
          balances={balances}
          onDelete={onDeleteTransaction}
        />
      )}
    </section>
  )
}
