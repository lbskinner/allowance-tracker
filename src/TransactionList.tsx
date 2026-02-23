import { useState, useMemo } from 'react'
import type { Kid, Transaction } from './types'

type DateRange = 30 | 60 | 90 | 'all'

interface TransactionListProps {
  kid: Kid | null
  transactions: Transaction[]
  onBack: () => void
  onDeleteTransaction: (transactionId: string) => void
  onGetViewLink?: (kid: Kid) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function filterByDateRange(transactions: Transaction[], range: DateRange): Transaction[] {
  if (range === 'all') return transactions
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - range)
  cutoff.setHours(0, 0, 0, 0)
  return transactions.filter((t) => new Date(t.date) >= cutoff)
}

function runningBalances(transactions: Transaction[]): Map<string, number> {
  const byDate = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const map = new Map<string, number>()
  let balance = 0
  for (const t of byDate) {
    balance += t.type === 'credit' ? t.amount : -t.amount
    map.set(t.id, balance)
  }
  return map
}

export function TransactionList({ kid, transactions, onBack, onDeleteTransaction, onGetViewLink }: TransactionListProps) {
  const [dateRange, setDateRange] = useState<DateRange>(30)
  const filtered = useMemo(
    () => filterByDateRange(transactions, dateRange),
    [transactions, dateRange]
  )
  const byDateNewestFirst = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered]
  )
  const balances = useMemo(() => runningBalances(filtered), [filtered])

  if (!kid) return null

  return (
    <section className="transaction-list-section">
      <div className="transaction-list-header">
        <h2>Transactions – {kid.name}</h2>
        <div className="transaction-list-header-actions">
          {onGetViewLink && (
            <button type="button" onClick={() => onGetViewLink(kid)} className="secondary">
              Get view link
            </button>
          )}
          <button type="button" onClick={onBack} className="back secondary">
            ← Back to summary
          </button>
        </div>
      </div>
      {transactions.length > 0 && (
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
      )}
      {filtered.length === 0 ? (
        <p className="empty-state">
          {transactions.length === 0 ? 'No transactions yet.' : 'No transactions in this range.'}
        </p>
      ) : (
        <ul className="transaction-list">
          {byDateNewestFirst.map((t) => (
            <li key={t.id} className="transaction-item" data-type={t.type}>
              <div className="transaction-main">
                <span className="transaction-amount" data-type={t.type}>
                  {t.type === 'credit' ? '+' : '−'}${t.amount.toFixed(2)}
                </span>
                <span className="transaction-date">{formatDate(t.date)}</span>
                <span className="transaction-balance" data-negative={balances.get(t.id)! < 0}>
                  Total after this: ${balances.get(t.id)!.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this transaction?')) {
                      onDeleteTransaction(t.id)
                    }
                  }}
                  className="transaction-delete"
                  title="Delete transaction"
                  aria-label="Delete transaction"
                >
                  Delete
                </button>
              </div>
              {t.description && (
                <div className="transaction-desc">{t.description}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

