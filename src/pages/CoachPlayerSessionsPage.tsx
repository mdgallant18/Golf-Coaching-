import { useEffect, useState } from 'react'
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

function toPlainText(markdown: string) {
  return markdown.replace(/^##\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1')
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function renderReportMarkdown(markdown: string) {
  const blocks = markdown
    .split(/\n(?=##\s)/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((block, i) => {
    const headerMatch = block.match(/^##\s+(.+)/)
    if (headerMatch) {
      const rest = block.slice(headerMatch[0].length).trim()
      return (
        <div key={i}>
          <h3>{headerMatch[1]}</h3>
          {rest.split('\n\n').map((p, j) => (
            <p key={j}>{renderBold(p)}</p>
          ))}
        </div>
      )
    }
    return (
      <p key={i}>{renderBold(block)}</p>
    )
  })
}

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
  const [report, setReport] = useState<{ summary: string; report: string } | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

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
      setReport(result)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Could not generate the game report.')
    } finally {
      setReportLoading(false)
    }
  }

  const handleShare = async () => {
    if (!report) return
    const text = `${report.summary}\n\n${toPlainText(report.report)}`
    const title = `${playerName} — Game Report`
    if (navigator.share) {
      try {
        await navigator.share({ title, text })
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(text)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
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

      {report && (
        <div className="recap-card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>{report.summary}</h2>
          {renderReportMarkdown(report.report)}
          <button type="button" className="primary-button" style={{ marginTop: 16 }} onClick={handleShare}>
            {shareCopied ? 'Copied!' : 'Share report'}
          </button>
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
