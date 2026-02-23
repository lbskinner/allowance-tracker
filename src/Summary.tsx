import type { Kid } from './types'

interface SummaryProps {
  kids: Kid[]
  getBalanceForKid: (kidId: string) => number
  onAddTransaction: (type: 'credit' | 'expense', kidId: string) => void
  onViewTransactions: (kidId: string) => void
  onAddKid: () => void
}

export function Summary({
  kids,
  getBalanceForKid,
  onAddTransaction,
  onViewTransactions,
  onAddKid,
}: SummaryProps) {
  return (
    <section className="summary">
      <h2>Allowance summary</h2>
      <div className="summary-cards">
        {kids.map((kid) => (
          <div key={kid.id} className="card">
            <div className="card-header">
              <span className="kid-name">{kid.name}</span>
              <span className="balance" data-negative={getBalanceForKid(kid.id) < 0}>
                ${getBalanceForKid(kid.id).toFixed(2)}
              </span>
            </div>
            <div className="card-actions">
              <button type="button" onClick={() => onAddTransaction('credit', kid.id)}>
                Add credit
              </button>
              <button type="button" onClick={() => onAddTransaction('expense', kid.id)}>
                Add expense
              </button>
              <button type="button" onClick={() => onViewTransactions(kid.id)} className="secondary">
                View transactions
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAddKid} className="add-kid-btn">
        + Add kid
      </button>
    </section>
  )
}
