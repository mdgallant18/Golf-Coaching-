import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPlayerSessions, fetchProfileName, generateGameReport } from '../lib/sessions'
import { BUCKET_LABELS, SESSION_TYPE_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

export function CoachPlayerSessionsPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [report, setReport] = useState<{ summary: string; report: string } | null>(null)

  useEffect(() => {
    if (!playerId) return
    Promise.all([fetchProfileName(playerId), fetchPlayerSessions(playerId)])
      .then(([name, sessions]) => {
        setPlayerName(name)
        setSessions(sessions)
      })
      .finally(() => setLoading(false))
  }, [playerId])

  const handleGenerateReport = async () => {
    if (!playerId) return
    setReportLoading(true)
    setReportError(null)
    try {
      const result = await generateGameReport(playerId, playerName)
      setReport(result)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Could not generate the game report.')
    } finally {
      setReportLoading(false)
    }
  }

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

      {!loading && sessions.length > 0 && (
        <button
          type="button"
          className="primary-button"
          style={{ marginBottom: 20 }}
          disabled={reportLoading}
          onClick={handleGenerateReport}
        >
          {reportLoading ? 'Generating game report…' : `Generate game report (last ${Math.min(sessions.length, 10)})`}
        </button>
      )}

      {reportError && <p className="form-error">{reportError}</p>}

      {report && (
        <div className="recap-card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>{report.summary}</h2>
          {report.report.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}

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
