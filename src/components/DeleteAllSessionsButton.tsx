import { useState } from 'react'

interface DeleteAllSessionsButtonProps {
  count: number
  onConfirm: () => Promise<void>
}

export function DeleteAllSessionsButton({ count, onConfirm }: DeleteAllSessionsButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (count === 0) return null

  const handleConfirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete these sessions.')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button type="button" className="danger-text-button" onClick={() => setConfirming(true)}>
        Delete all sessions
      </button>
    )
  }

  return (
    <div className="wrapup-form">
      <p className="form-error" style={{ margin: 0 }}>
        This permanently deletes all {count} session{count === 1 ? '' : 's'}. This cannot be
        undone. Type DELETE to confirm.
      </p>
      <input
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Type DELETE"
        autoCapitalize="characters"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="danger-button"
          style={{ flex: 1 }}
          disabled={typed !== 'DELETE' || deleting}
          onClick={handleConfirm}
        >
          {deleting ? 'Deleting…' : `Delete all ${count}`}
        </button>
        <button
          type="button"
          className="secondary-button"
          style={{ flex: 1 }}
          disabled={deleting}
          onClick={() => {
            setConfirming(false)
            setTyped('')
          }}
        >
          Cancel
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
