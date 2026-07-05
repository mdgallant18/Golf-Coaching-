import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchPlayerSessions } from '../lib/sessions'
import { computeTrendBlurb } from '../lib/trends'
import { BUCKET_LABELS, SESSION_TYPE_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

export function PlayerHomePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchPlayerSessions(profile.id)
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [profile])

  const trendBlurb = computeTrendBlurb(sessions)

  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Player</p>
          <h1>Hey, {profile?.full_name?.split(' ')[0] ?? 'there'}</h1>
        </div>
        <button className="text-button" onClick={() => signOut()}>
          Log out
        </button>
      </header>

      <button type="button" className="primary-button" onClick={() => navigate('/player/new')}>
        Log a session
      </button>

      {trendBlurb && (
        <section className="placeholder-card" style={{ marginTop: 20 }}>
          <p style={{ margin: 0 }}>{trendBlurb}</p>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>Your sessions</h2>
        {loading && <p>Loading…</p>}
        {!loading && sessions.length === 0 && (
          <p>No sessions logged yet — log your first one above.</p>
        )}
        <ul className="session-list">
          {sessions.map((session) => (
            <li key={session.id} className="session-list-item">
              <div className="session-list-item-header">
                <span className="bucket-tag">{BUCKET_LABELS[session.bucket]}</span>
                <span className="session-date">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="session-type-label">{SESSION_TYPE_LABELS[session.session_type]}</p>
              <p className="session-summary">{session.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
