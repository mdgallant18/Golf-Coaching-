import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  deleteSession,
  fetchProfileName,
  fetchSessionById,
  generateCoachSessionReport,
} from '../lib/sessions'
import { renderReportMarkdown } from '../lib/reportFormat'
import { BUCKET_LABELS, SESSION_TYPE_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<'player' | 'coach'>('player')
  const [coachReport, setCoachReport] = useState<{ summary: string; report: string } | null>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState<string | null>(null)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    fetchSessionById(sessionId)
      .then(setSession)
      .finally(() => setLoading(false))
  }, [sessionId])

  const isCoachViewingPlayer = profile?.role === 'coach' && session && session.player_id !== profile.id

  const handleGenerateCoachTake = async () => {
    if (!session) return
    setCoachLoading(true)
    setCoachError(null)
    try {
      const playerName = await fetchProfileName(session.player_id)
      const result = await generateCoachSessionReport(session, playerName)
      setCoachReport(result)
      setView('coach')
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : "Could not generate the coach's take.")
    } finally {
      setCoachLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!session) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSession(session.id)
      navigate(isCoachViewingPlayer ? `/coach/players/${session.player_id}` : '/player', {
        replace: true,
      })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this session.')
      setDeleting(false)
    }
  }

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
              <h1>{view === 'coach' && coachReport ? coachReport.summary : session.summary}</h1>
            </div>
          </header>
          <p className="session-type-label">
            {SESSION_TYPE_LABELS[session.session_type]} ·{' '}
            {new Date(session.created_at).toLocaleDateString()}
          </p>

          {isCoachViewingPlayer && (
            <div className="wrapup-form" style={{ marginBottom: 20 }}>
              {coachReport && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={view === 'player' ? 'primary-button' : 'secondary-button'}
                    style={{ flex: 1 }}
                    onClick={() => setView('player')}
                  >
                    Player view
                  </button>
                  <button
                    type="button"
                    className={view === 'coach' ? 'primary-button' : 'secondary-button'}
                    style={{ flex: 1 }}
                    onClick={() => setView('coach')}
                  >
                    Coach view
                  </button>
                </div>
              )}
              {!coachReport && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={coachLoading}
                  onClick={handleGenerateCoachTake}
                >
                  {coachLoading ? "Generating coach's take…" : "Generate coach's take"}
                </button>
              )}
              {coachError && <p className="form-error">{coachError}</p>}
            </div>
          )}

          <div className="recap-card">
            {view === 'coach' && coachReport
              ? renderReportMarkdown(coachReport.report)
              : session.recap.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </div>

          <div style={{ marginTop: 12 }}>
            {!confirmingDelete && (
              <button
                type="button"
                className="danger-text-button"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete session
              </button>
            )}
            {confirmingDelete && (
              <div className="wrapup-form">
                <p className="form-error" style={{ margin: 0 }}>
                  Delete this session for good? This can't be undone.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="danger-button"
                    style={{ flex: 1 }}
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ flex: 1 }}
                    disabled={deleting}
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && <p className="form-error">{deleteError}</p>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
