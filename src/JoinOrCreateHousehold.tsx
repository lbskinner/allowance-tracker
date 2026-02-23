import { useState } from 'react'

function getInitialCode(): string {
  if (typeof window === 'undefined') return ''
  const p = new URLSearchParams(window.location.search)
  return (p.get('join') ?? '').toUpperCase()
}

interface JoinOrCreateHouseholdProps {
  onJoin: (code: string) => Promise<void>
  onCreate: (name?: string) => Promise<void>
  error: Error | null
}

export function JoinOrCreateHousehold({ onJoin, onCreate, error: parentError }: JoinOrCreateHouseholdProps) {
  const [code, setCode] = useState(getInitialCode)
  const [householdName, setHouseholdName] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const error = parentError ?? (localError ? new Error(localError) : null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setLocalError(null)
    setJoining(true)
    try {
      await onJoin(trimmed)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    } finally {
      setJoining(false)
    }
  }

  const handleCreate = async () => {
    setLocalError(null)
    setCreating(true)
    try {
      await onCreate(householdName.trim() || undefined)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="join-create-household">
      <h2>Set up your household</h2>
      <p className="join-create-intro">
        Join an existing household with a code from your partner, or create a new one.
      </p>

      {error && (
        <div className="join-create-error-wrap" role="alert">
          <p className="app-error join-create-error">{error.message}</p>
          {error.message.includes('Invalid or expired') && (
            <p className="join-create-error-hint">
              Get the 6-character code from your partner: they open this app, sign in, then tap “Invite partner” and copy the code or link.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleJoin} className="join-form">
        <label htmlFor="invite-code">Invite code</label>
        <input
          id="invite-code"
          type="text"
          placeholder="e.g. ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={10}
          autoComplete="off"
          className="join-input"
        />
        <button type="submit" disabled={joining || !code.trim()} className="btn-primary">
          {joining ? 'Joining…' : 'Join household'}
        </button>
      </form>

      <div className="join-create-divider">
        <span>or</span>
      </div>

      <div className="join-form">
        <label htmlFor="household-name">Household name (optional)</label>
        <input
          id="household-name"
          type="text"
          placeholder="e.g. Smith Family"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          className="join-input"
          aria-label="Household name"
        />
      </div>
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="btn-secondary create-household-btn"
      >
        {creating ? 'Creating…' : 'Create new household'}
      </button>
    </section>
  )
}
