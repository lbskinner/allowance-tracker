import { useState, type FormEvent } from 'react'
import type { Kid } from './types'
import type { TransactionType } from './types'

interface AddTransactionFormProps {
  kids: Kid[]
  selectedKidId: string | null
  type: TransactionType
  onSubmit: (kidId: string, type: TransactionType, amount: number, description: string) => void
  onCancel: () => void
}

export function AddTransactionForm({
  kids,
  selectedKidId,
  type,
  onSubmit,
  onCancel,
}: AddTransactionFormProps) {
  const [kidId, setKidId] = useState(selectedKidId ?? kids[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!kidId || Number.isNaN(num) || num <= 0) return
    onSubmit(kidId, type, num, description)
    onCancel()
  }

  const label = type === 'credit' ? 'Add credit' : 'Add expense'

  return (
    <section className="form-section">
      <h2>{label}</h2>
      <form onSubmit={handleSubmit} className="transaction-form">
        <label>
          Kid
          <select
            value={kidId}
            onChange={(e) => setKidId(e.target.value)}
            required
            aria-label="Select kid"
          >
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount ($)
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            aria-label="Amount"
          />
        </label>
        <label>
          Explanation <span className="optional">(optional)</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'credit' ? 'e.g. Weekly allowance' : 'e.g. Toy store'}
            aria-label="Description"
          />
        </label>
        <p className="form-note">Date will be set to today automatically.</p>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="secondary">
            Cancel
          </button>
          <button type="submit">{label}</button>
        </div>
      </form>
    </section>
  )
}
