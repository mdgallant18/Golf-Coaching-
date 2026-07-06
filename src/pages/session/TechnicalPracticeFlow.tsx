import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { MultiSelectChips } from '../../components/MultiSelectChips'
import { RatingScale } from '../../components/RatingScale'
import { RecapResult } from '../../components/RecapResult'
import { PRACTICE_AREAS, PRACTICE_AREA_BUCKETS, RATING_OPTIONS } from '../../data/technicalPractice'
import { submitSession } from '../../lib/sessions'

export function TechnicalPracticeFlow() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [areas, setAreas] = useState<string[]>([])
  const [cue, setCue] = useState('')
  const [notes, setNotes] = useState('')
  const [focusRating, setFocusRating] = useState<string>()
  const [nextFocus, setNextFocus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ summary: string; recap: string } | null>(null)

  const toggleArea = (area: string) => {
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  const canSubmit = areas.length > 0 && !!focusRating

  const handleSubmit = async () => {
    if (!profile || !canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const bucket = PRACTICE_AREA_BUCKETS[areas[0] as keyof typeof PRACTICE_AREA_BUCKETS]
      const session = await submitSession({
        playerId: profile.id,
        playerName: profile.full_name,
        sessionType: 'technical_practice',
        bucket,
        answers: { areas, cue, notes, focusRating, nextFocus },
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
          <p className="eyebrow">Technical Practice</p>
          <h1>What did you work on?</h1>
        </div>
      </header>

      <div className="wrapup-form">
        <label>
          Areas worked on
          <MultiSelectChips options={PRACTICE_AREAS} selected={areas} onToggle={toggleArea} />
        </label>

        <label>
          Cue or thought you were working on
          <textarea
            rows={2}
            placeholder="e.g. feeling the clubface square through impact"
            value={cue}
            onChange={(e) => setCue(e.target.value)}
          />
        </label>

        <label>
          Notes on today's work
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <RatingScale
          label="How was your focus today?"
          options={RATING_OPTIONS}
          value={focusRating}
          onChange={setFocusRating}
        />

        <label>
          Next-session focus
          <textarea rows={2} value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="button" className="primary-button" disabled={submitting || !canSubmit} onClick={handleSubmit}>
          {submitting ? 'Generating your recap…' : 'Finish session'}
        </button>
      </div>

      <button type="button" className="text-button" onClick={() => navigate('/player/new')}>
        Back
      </button>
    </div>
  )
}
