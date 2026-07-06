import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { RatingScale } from '../../components/RatingScale'
import { RecapResult } from '../../components/RecapResult'
import { RATING_OPTIONS } from '../../data/technicalPractice'
import { submitSession } from '../../lib/sessions'
import { BUCKET_LABELS } from '../../types/domain'
import type { Bucket } from '../../types/domain'

interface Drill {
  id: string
  club: string
  target: string
  goal: string
  result: string
}

function emptyDrill(): Drill {
  return { id: crypto.randomUUID(), club: '', target: '', goal: '', result: '' }
}

const BUCKET_OPTIONS = Object.entries(BUCKET_LABELS) as [Bucket, string][]

export function DrillLoggerFlow() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [bucket, setBucket] = useState<Bucket | undefined>()
  const [drills, setDrills] = useState<Drill[]>([emptyDrill()])
  const [executionRating, setExecutionRating] = useState<string>()
  const [processRating, setProcessRating] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ summary: string; recap: string } | null>(null)

  const updateDrill = (id: string, field: keyof Drill, value: string) => {
    setDrills((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  const removeDrill = (id: string) => {
    setDrills((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== id) : prev))
  }

  const canSubmit =
    !!bucket &&
    drills.every((d) => d.club.trim() && d.goal.trim() && d.result.trim()) &&
    !!executionRating &&
    !!processRating

  const handleSubmit = async () => {
    if (!profile || !bucket || !canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const session = await submitSession({
        playerId: profile.id,
        playerName: profile.full_name,
        sessionType: 'performance_practice',
        bucket,
        answers: {
          drills: drills.map(({ club, target, goal, result }) => ({ club, target, goal, result })),
          executionRating,
          processRating,
        },
      })
      setResult({ summary: session.summary, recap: session.recap })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your session.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <RecapResult summary={result.summary} recap={result.recap} onDone={() => navigate('/player')} />
  }

  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Drill Session</p>
          <h1>Log your drills</h1>
        </div>
      </header>

      <div className="wrapup-form">
        <label>
          This session was mainly about
          <select value={bucket ?? ''} onChange={(e) => setBucket(e.target.value as Bucket)}>
            <option value="" disabled>
              Choose a focus area
            </option>
            {BUCKET_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {drills.map((drill, index) => (
          <div key={drill.id} className="drill-row">
            <div className="drill-row-header">
              <h3>Drill {index + 1}</h3>
              {drills.length > 1 && (
                <button type="button" className="text-button" onClick={() => removeDrill(drill.id)}>
                  Remove
                </button>
              )}
            </div>
            <label>
              Club / shot
              <input
                type="text"
                placeholder="e.g. 7-iron"
                value={drill.club}
                onChange={(e) => updateDrill(drill.id, 'club', e.target.value)}
              />
            </label>
            <label>
              Target / distance
              <input
                type="text"
                placeholder="e.g. 150 yards"
                value={drill.target}
                onChange={(e) => updateDrill(drill.id, 'target', e.target.value)}
              />
            </label>
            <label>
              Goal
              <input
                type="text"
                placeholder="e.g. 10 in a row"
                value={drill.goal}
                onChange={(e) => updateDrill(drill.id, 'goal', e.target.value)}
              />
            </label>
            <label>
              Actual result
              <input
                type="text"
                placeholder="e.g. got to 7"
                value={drill.result}
                onChange={(e) => updateDrill(drill.id, 'result', e.target.value)}
              />
            </label>
          </div>
        ))}

        <button type="button" className="text-button" onClick={() => setDrills((prev) => [...prev, emptyDrill()])}>
          + Add another drill
        </button>

        <RatingScale
          label="How was your execution today?"
          options={RATING_OPTIONS}
          value={executionRating}
          onChange={setExecutionRating}
        />

        <RatingScale
          label="How was your process today?"
          options={RATING_OPTIONS}
          value={processRating}
          onChange={setProcessRating}
        />

        {error && <p className="form-error">{error}</p>}

        <button type="button" className="primary-button" disabled={submitting || !canSubmit} onClick={handleSubmit}>
          {submitting ? 'Generating your recap…' : 'Finish session'}
        </button>
      </div>

      <button type="button" className="text-button" onClick={() => navigate('/player/new/performance')}>
        Back
      </button>
    </div>
  )
}
