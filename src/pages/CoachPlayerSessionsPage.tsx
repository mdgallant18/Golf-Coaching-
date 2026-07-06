import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchPlayerSessions,
  fetchProfileName,
  generateGameReport,
  type GameReportSessionFilter,
  type GameReportTimeRange,
} from '../lib/sessions'
import { BUCKET_LABELS, SESSION_TYPE_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'
import { renderReportMarkdown } from '../lib/reportFormat'
import { shareNodeAsImage } from '../lib/exportReport'

type ReportResult = { summary: string; report: string }

export function CoachPlayerSessionsPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [sessionFilter, setSessionFilter] = useState<GameReportSessionFilter>('all')
  const [timeRange, setTimeRange] = useState<GameReportTimeRange>('last10')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const [view, setView] = useState<'coach' | 'player'>('coach')
  const [coachReport, setCoachReport] = useState<ReportResult | null>(null)
  const [playerReport, setPlayerReport] = useState<ReportResult | null>(null)
  const [playerReportLoading, setPlayerReportLoading] = useState(false)

  const [shareStatus, setShareStatus] = useState<'idle' | 'saved'>('idle')
  const reportDocRef = useRef<HTMLDivElement>(null)

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
      const result = await generateGameReport(playerId, playerName, { sessionFilter, timeRange })
      setCoachReport(result)
      setPlayerReport(null)
      setView('coach')
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Could not generate the game report.')
    } finally {
      setReportLoading(false)
    }
  }

  const handleShowPlayerView = async () => {
    if (playerReport || !playerId) {
      setView('player')
      return
    }
    setPlayerReportLoading(true)
    setReportError(null)
    try {
      const result = await generateGameReport(playerId, playerName, {
        sessionFilter,
        timeRange,
        audience: 'player',
      })
      setPlayerReport(result)
      setView('player')
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Could not generate the player version.')
    } finally {
      setPlayerReportLoading(false)
    }
  }

  const activeReport = view === 'coach' ? coachReport : playerReport

  const handleShare = async () => {
    if (!activeReport || !reportDocRef.current) return
    const filename = `${playerName.replace(/\s+/g, '-').toLowerCase()}-report.png`
    const title = `${playerName} — Game Report`
    try {
      const result = await shareNodeAsImage(reportDocRef.current, filename, title, activeReport.summary)
      if (result === 'downloaded') {
        setShareStatus('saved')
        setTimeout(() => setShareStatus('idle'), 2000)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setReportError('Could not create a shareable image of the report.')
    }
  }

  const handleSaveAsPdf = () => {
    window.print()
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
        <div className="wrapup-form" style={{ marginBottom: 20 }}>
          <label>
            Session types to include
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as GameReportSessionFilter)}
            >
              <option value="all">All session types</option>
              <option value="round_tournament">Rounds & tournaments only</option>
              <option value="technical_practice">Technical practice only</option>
              <option value="performance_practice">Performance practice only</option>
            </select>
          </label>

          <label>
            Time range
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as GameReportTimeRange)}>
              <option value="last10">Last 10 sessions</option>
              <option value="last30days">Last 30 days</option>
              <option value="last90days">Last 90 days</option>
              <option value="alltime">All time (last 30 max)</option>
            </select>
          </label>

          <button type="button" className="primary-button" disabled={reportLoading} onClick={handleGenerateReport}>
            {reportLoading ? 'Generating game report…' : 'Generate game report'}
          </button>
        </div>
      )}

      {reportError && <p className="form-error">{reportError}</p>}

      {coachReport && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={view === 'coach' ? 'primary-button' : 'secondary-button'}
              style={{ flex: 1 }}
              onClick={() => setView('coach')}
            >
              Coach view
            </button>
            <button
              type="button"
              className={view === 'player' ? 'primary-button' : 'secondary-button'}
              style={{ flex: 1 }}
              disabled={playerReportLoading}
              onClick={handleShowPlayerView}
            >
              {playerReportLoading ? 'Generating…' : 'Player view'}
            </button>
          </div>

          {activeReport && (
            <div className="recap-card report-document" style={{ marginBottom: 24 }} ref={reportDocRef}>
              <div className="report-letterhead">
                <p className="report-letterhead-brand">
                  Golf Coaching — {view === 'coach' ? 'Player Progress Report' : 'Player Check-in'}
                </p>
                <h2 className="report-letterhead-player">{playerName}</h2>
                <p className="report-letterhead-meta">
                  Prepared by Matt Gallant · {new Date().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <h2 className="report-headline">{activeReport.summary}</h2>
              {view === 'coach'
                ? renderReportMarkdown(activeReport.report)
                : activeReport.report.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}
              <div className="report-actions">
                <button type="button" className="primary-button" onClick={handleSaveAsPdf}>
                  Save as PDF
                </button>
                <button type="button" className="secondary-button" onClick={handleShare}>
                  {shareStatus === 'saved' ? 'Saved!' : 'Quick share'}
                </button>
              </div>
            </div>
          )}
        </>
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
