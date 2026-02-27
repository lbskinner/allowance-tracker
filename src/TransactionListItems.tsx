import { useState } from 'react'
import type { Transaction } from './types'
import { formatDate } from './utils/formatDate'

interface TransactionListItemsProps {
  /** Transactions in display order (e.g. newest first) */
  transactions: Transaction[]
  /** Running balance per transaction id */
  balances: Map<string, number>
  /** If provided, show a delete button that calls this */
  onDelete?: (transactionId: string) => void
  listClassName?: string
}

export function TransactionListItems({
  transactions,
  balances,
  onDelete,
  listClassName = 'transaction-list',
}: TransactionListItemsProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (transactions.length === 0) return null

  return (
    <ul className={listClassName}>
      {transactions.map((t) => (
        <li key={t.id} className="transaction-item" data-type={t.type}>
          <div className="transaction-main">
            <span className="transaction-amount" data-type={t.type}>
              {t.type === 'credit' ? '+' : '−'}${t.amount.toFixed(2)}
            </span>
            <span className="transaction-date">{formatDate(t.date)}</span>
            <span className="transaction-balance" data-negative={(balances.get(t.id) ?? 0) < 0}>
              Running total: ${(balances.get(t.id) ?? 0).toFixed(2)}
            </span>
            {onDelete &&
              (pendingDeleteId === t.id ? (
                <span className="transaction-delete-confirm">
                  Delete?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(t.id)
                      setPendingDeleteId(null)
                    }}
                    className="transaction-delete-confirm-yes"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(null)}
                    className="transaction-delete-confirm-cancel"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(t.id)}
                  className="transaction-delete"
                  title="Delete transaction"
                  aria-label="Delete transaction"
                >
                  Delete
                </button>
              ))}
          </div>
          {t.description && (
            <div className="transaction-desc">{t.description}</div>
          )}
          {t.addedByDisplay && (
            <div className="transaction-added-by">by {t.addedByDisplay}</div>
          )}
        </li>
      ))}
    </ul>
  )
}
