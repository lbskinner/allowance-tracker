import { useState, type FormEvent } from 'react'

interface AddKidFormProps {
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
}

export function AddKidForm({ onSubmit, onCancel }: AddKidFormProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
      onCancel()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="form-section">
      <h2>Add kid</h2>
      <form onSubmit={handleSubmit} className="transaction-form">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kid's name"
            required
            autoFocus
            disabled={submitting}
            aria-label="Kid name"
          />
        </label>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="secondary" disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Adding…' : 'Add kid'}
          </button>
        </div>
      </form>
    </section>
  )
}
