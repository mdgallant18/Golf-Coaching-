import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPlayerSessions, fetchProfileName } from '../lib/sessions'
import { BUCKET_LABELS, SESSION_TYPE_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

export function CoachPlayerSessionsPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    Promise.all([fetchProfileName(playerId), fetchPlayerSessions(playerId)])
      .then(([name, sessions]) => {
        setPlayerName(name)
        setSessions(sessions)
      })
      .finally(() => setLoading(false))
  }, [playerId])

  return (
    <div className="app-screen">
      <button type="button" className="text-button" onClick={() => navigate('/coach')}>
        Back
      </button>

      <header className="app-header">
        <div>
          <p className="eyebrow">Player</p>
          <h1>{playerName || 'Loading…'}</h1>
        </div>
      </header>

      {loading && <p>Loading…</p>}

      {!loading && sessions.length === 0 && <p>No sessions logged yet.</p>}

      <ul className="session-list">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              type="button"
              className="session-list-item session-list-item-button"
              onClick={() => navigate(`/sessions/${session.id}`)}
            >
              <div className="session-list-item-header">
                <span className="bucket-tag">{BUCKET_LABELS[session.bucket]}</span>
                <span className="session-date">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="session-type-label">{SESSION_TYPE_LABELS[session.session_type]}</p>
              <p className="session-summary">{session.summary}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
