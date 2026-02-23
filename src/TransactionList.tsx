import type { Kid, Transaction } from './types'

interface TransactionListProps {
  kid: Kid | null
  transactions: Transaction[]
  onBack: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TransactionList({ kid, transactions, onBack }: TransactionListProps) {
  if (!kid) return null

  return (
    <section className="transaction-list-section">
      <h2>Transactions – {kid.name}</h2>
      <button type="button" onClick={onBack} className="back secondary">
        ← Back to summary
      </button>
      {transactions.length === 0 ? (
        <p className="empty-state">No transactions yet.</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((t) => (
            <li key={t.id} className="transaction-item" data-type={t.type}>
              <div className="transaction-main">
                <span className="transaction-amount" data-type={t.type}>
                  {t.type === 'credit' ? '+' : '−'}${t.amount.toFixed(2)}
                </span>
                <span className="transaction-date">{formatDate(t.date)}</span>
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
