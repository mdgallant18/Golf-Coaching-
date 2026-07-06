import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchSessionById } from '../lib/sessions'
import { BUCKET_LABELS, SESSION_TYPE_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    fetchSessionById(sessionId)
      .then(setSession)
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="app-screen">
      <button type="button" className="text-button" onClick={() => navigate(-1)}>
        Back
      </button>

      {loading && <p>Loading…</p>}

      {!loading && !session && <p>Session not found.</p>}

      {session && (
        <>
          <header className="app-header">
            <div>
              <p className="eyebrow">{BUCKET_LABELS[session.bucket]}</p>
              <h1>{session.summary}</h1>
            </div>
          </header>
          <p className="session-type-label">
            {SESSION_TYPE_LABELS[session.session_type]} ·{' '}
            {new Date(session.created_at).toLocaleDateString()}
          </p>

          <div className="recap-card">
            {session.recap.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
