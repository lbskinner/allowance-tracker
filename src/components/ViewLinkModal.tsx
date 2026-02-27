import { useState, useEffect } from 'react'
import type { Kid } from '../types/types'

interface ViewLinkModalProps {
  kid: Kid
  getOrCreateViewToken: (kidId: string) => Promise<string | null>
  onClose: () => void
}

export function ViewLinkModal({ kid, getOrCreateViewToken, onClose }: ViewLinkModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    getOrCreateViewToken(kid.id).then((t) => {
      if (!cancelled) {
        setToken(t ?? null)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [kid.id, getOrCreateViewToken])

  const viewUrl =
    token && typeof window !== 'undefined'
      ? `${window.location.origin}/view/${encodeURIComponent(token)}`
      : ''

  const copyLink = () => {
    if (!viewUrl) return
    navigator.clipboard.writeText(viewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal view-link-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="view-link-modal-title"
      >
        <h2 id="view-link-modal-title">View link for {kid.name}</h2>
        <p className="view-link-intro">
          Share this link with {kid.name}. They can bookmark it to see their transactions (read-only, last 30 days). The link stays the same.
        </p>
        {loading ? (
          <p className="view-link-loading">Loading…</p>
        ) : token ? (
          <>
            <div className="view-link-url-wrap">
              <input
                type="text"
                readOnly
                value={viewUrl}
                className="view-link-input"
                aria-label="View link"
              />
              <button type="button" onClick={copyLink} className="btn-copy">
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </>
        ) : (
          <p className="app-error">Could not load the view link.</p>
        )}
        <button type="button" onClick={onClose} className="btn-secondary view-link-close">
          Close
        </button>
      </div>
    </div>
  )
}

