import { useState, useEffect, useRef } from 'react'
import type { Kid } from './types'

interface SummaryProps {
  kids: Kid[]
  onAddTransaction: (type: 'credit' | 'expense', kidId: string) => void
  onAddAllowance: (kidId: string) => void
  onConfigureAllowance: (kid: Kid) => void
  onGetViewLink: (kid: Kid) => void
  onViewTransactions: (kidId: string) => void
  onAddKid: () => void
}

export function Summary({
  kids,
  onAddTransaction,
  onAddAllowance,
  onConfigureAllowance,
  onGetViewLink,
  onViewTransactions,
  onAddKid,
}: SummaryProps) {
  const [openMenuKidId, setOpenMenuKidId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openMenuKidId === null) return
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setOpenMenuKidId(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuKidId])

  return (
    <section className="summary">
      <h2>Allowance summary</h2>
      <div className="summary-cards">
        {kids.map((kid) => (
          <div key={kid.id} className="card">
            <div className="card-header">
              <div className="card-header-name-row">
                <span className="kid-name">{kid.name}</span>
                <div className="card-menu" ref={openMenuKidId === kid.id ? menuRef : null}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuKidId(openMenuKidId === kid.id ? null : kid.id)
                    }}
                    className="card-menu-btn"
                    title="More actions"
                    aria-label={`More actions for ${kid.name}`}
                    aria-expanded={openMenuKidId === kid.id}
                  >
                    ⋯
                  </button>
                  {openMenuKidId === kid.id && (
                    <div className="card-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          onConfigureAllowance(kid)
                          setOpenMenuKidId(null)
                        }}
                      >
                        Set allowance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onGetViewLink(kid)
                          setOpenMenuKidId(null)
                        }}
                      >
                        Get view link
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className="balance" data-negative={kid.currentBalance < 0}>
                ${kid.currentBalance.toFixed(2)}
              </span>
            </div>
            <div className="card-actions">
              {kid.allowanceAmount != null && (
                <button
                  type="button"
                  onClick={() => onAddAllowance(kid.id)}
                  className="add-allowance-btn"
                >
                  Add (${kid.allowanceAmount.toFixed(2)})
                </button>
              )}
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
