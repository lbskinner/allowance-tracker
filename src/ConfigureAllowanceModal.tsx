import { useState, useEffect } from 'react'
import type { Kid } from './types'

interface ConfigureAllowanceModalProps {
  kid: Kid | null
  onSave: (kidId: string, amount: number | null) => Promise<void>
  onClose: () => void
}

export function ConfigureAllowanceModal({ kid, onSave, onClose }: ConfigureAllowanceModalProps) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kid) {
      setAmount(kid.allowanceAmount != null ? String(kid.allowanceAmount) : '')
    }
  }, [kid])

  if (!kid) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const num = parseFloat(amount.trim())
      const value =
        amount.trim() === '' || Number.isNaN(num) || num <= 0
          ? null
          : Math.round(num * 100) / 100
      await onSave(kid.id, value)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setSaving(true)
    try {
      await onSave(kid.id, null)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal configure-allowance-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="configure-allowance-title">
        <h2 id="configure-allowance-title">Allowance amount for {kid.name}</h2>
        <p className="configure-allowance-intro">
          Set a default amount for the &quot;Add allowance&quot; button. Leave empty to hide the button.
        </p>
        <form onSubmit={handleSave}>
          <label htmlFor="allowance-amount">Amount ($)</label>
          <input
            id="allowance-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="configure-allowance-input"
            aria-label="Allowance amount"
          />
          <div className="configure-allowance-actions">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={handleClear} disabled={saving} className="btn-secondary">
              Clear
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
