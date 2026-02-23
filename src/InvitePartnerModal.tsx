import { useState, useEffect } from 'react'

interface InvitePartnerModalProps {
  getInviteCode: () => Promise<string | null>
  onClose: () => void
}

export function InvitePartnerModal({ getInviteCode, onClose }: InvitePartnerModalProps) {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    let cancelled = false
    getInviteCode().then((c) => {
      if (!cancelled) {
        setCode(c ?? null)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [getInviteCode])

  const joinLink = code
    ? `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?join=${code}`
    : ''

  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied('code')
    setTimeout(() => setCopied(null), 2000)
  }

  const copyLink = () => {
    if (!joinLink) return
    navigator.clipboard.writeText(joinLink)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal invite-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="invite-modal-title">
        <h2 id="invite-modal-title">Invite partner</h2>
        <p className="invite-modal-intro">
          Share this code or link with your partner. They can sign up or log in and enter the code (or open the link) to join this household.
        </p>
        {loading ? (
          <p className="invite-modal-loading">Loading code…</p>
        ) : code ? (
          <>
            <div className="invite-code-block">
              <span className="invite-code-value">{code}</span>
              <button type="button" onClick={copyCode} className="btn-copy">
                {copied === 'code' ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            <div className="invite-link-block">
              <input
                type="text"
                readOnly
                value={joinLink}
                className="invite-link-input"
                aria-label="Join link"
              />
              <button type="button" onClick={copyLink} className="btn-copy">
                {copied === 'link' ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </>
        ) : (
          <p className="app-error">Could not load invite code.</p>
        )}
        <button type="button" onClick={onClose} className="btn-secondary invite-modal-close">
          Close
        </button>
      </div>
    </div>
  )
}
