import { useState, useEffect } from 'react'
import type { Kid } from '../types/types'

const PRESET_SLOTS = 3

interface ConfigureAllowanceModalProps {
  kid: Kid | null
  onSave: (kidId: string, allowanceAmount: number | null, presetAmounts: number[]) => Promise<void>
  onClose: () => void
}

function parsePresets(values: string[]): number[] {
  return values
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0)
    .map((n) => Math.round(n * 100) / 100)
    .slice(0, PRESET_SLOTS)
}

export function ConfigureAllowanceModal({ kid, onSave, onClose }: ConfigureAllowanceModalProps) {
  const [amount, setAmount] = useState('')
  const [presets, setPresets] = useState<string[]>(['', '', ''])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kid) {
      setAmount(kid.allowanceAmount != null ? String(kid.allowanceAmount) : '')
      const fromKid = kid.presetAmounts ?? []
      setPresets([
        fromKid[0] != null ? String(fromKid[0]) : '',
        fromKid[1] != null ? String(fromKid[1]) : '',
        fromKid[2] != null ? String(fromKid[2]) : '',
      ])
    }
  }, [kid])

  if (!kid) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const num = parseFloat(amount.trim())
      const allowanceValue =
        amount.trim() === '' || Number.isNaN(num) || num <= 0
          ? null
          : Math.round(num * 100) / 100
      const presetAmounts = parsePresets(presets)
      await onSave(kid.id, allowanceValue, presetAmounts)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    setAmount('')
    setPresets(['', '', ''])
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal configure-allowance-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="configure-allowance-title"
      >
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
          <p className="configure-allowance-intro configure-allowance-presets-label">
            Quick amounts for Add transaction (up to 3)
          </p>
          <div className="configure-allowance-presets">
            {[0, 1, 2].map((i) => (
              <label key={i} className="configure-allowance-preset-row">
                <span className="configure-allowance-preset-label">Amount {i + 1} ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={presets[i] ?? ''}
                  onChange={(e) => {
                    const next = [...presets]
                    next[i] = e.target.value
                    setPresets(next)
                  }}
                  className="configure-allowance-input"
                  aria-label={`Quick amount ${i + 1}`}
                />
              </label>
            ))}
          </div>
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

