import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { QuestionCard } from '../../components/QuestionCard'
import { ProgressBar } from '../../components/ProgressBar'
import { ROUND_QUESTIONS } from '../../data/roundQuestions'
import { bucketFromRoundAnswers } from '../../lib/bucketLogic'
import { submitSession } from '../../lib/sessions'
import { SESSION_TYPE_LABELS } from '../../types/domain'
import type { SessionType } from '../../types/domain'
import { RecapResult } from '../../components/RecapResult'

const ROUND_LIKE_TYPES: SessionType[] = ['round', 'tournament', 'performance_practice']

interface RoundStats {
  score: string
  fairwaysHit: string
  greensInRegulation: string
  putts: string
}

const EMPTY_STATS: RoundStats = { score: '', fairwaysHit: '', greensInRegulation: '', putts: '' }

export function RoundSessionFlow() {
  const { sessionType: sessionTypeParam } = useParams<{ sessionType: string }>()
  const sessionType: SessionType = ROUND_LIKE_TYPES.includes(sessionTypeParam as SessionType)
    ? (sessionTypeParam as SessionType)
    : 'round'

  const { profile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [stats, setStats] = useState<RoundStats>(EMPTY_STATS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ summary: string; recap: string } | null>(null)

  const totalSteps = ROUND_QUESTIONS.length + 1
  const isStatsStep = step === ROUND_QUESTIONS.length
  const currentQuestion = ROUND_QUESTIONS[step]
  const canAdvance = isStatsStep || answers[currentQuestion?.id] !== undefined

  const handleSubmit = async () => {
    if (!profile) return
    setSubmitting(true)
    setError(null)
    try {
      const bucket = bucketFromRoundAnswers(answers)
      const answerDetails = Object.fromEntries(
        ROUND_QUESTIONS.map((q) => {
          const label = q.options[answers[q.id]]?.label
          if (!label) return [q.id, undefined]
          const note = notes[q.id]?.trim()
          return [q.id, { answer: label, bucket: q.bucket, theme: q.theme, ...(note ? { note } : {}) }]
        }).filter(([, v]) => v),
      )
      const statsPayload = Object.fromEntries(
        Object.entries(stats).filter(([, v]) => v.trim() !== '').map(([k, v]) => [k, Number(v)]),
      )
      const payload = {
        questions: answerDetails,
        ...(Object.keys(statsPayload).length > 0 ? { stats: statsPayload } : {}),
      }
      const session = await submitSession({
        playerId: profile.id,
        playerName: profile.full_name,
        sessionType,
        bucket,
        answers: payload,
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
          <p className="eyebrow">{SESSION_TYPE_LABELS[sessionType]}</p>
          <h1>{isStatsStep ? 'Your numbers' : `Question ${step + 1} of ${ROUND_QUESTIONS.length}`}</h1>
        </div>
      </header>

      <ProgressBar current={step + 1} total={totalSteps} />

      {!isStatsStep && (
        <QuestionCard
          prompt={currentQuestion.prompt}
          options={currentQuestion.options}
          selectedIndex={answers[currentQuestion.id]}
          onSelect={(index) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }))}
          note={notes[currentQuestion.id] ?? ''}
          onNoteChange={(note) => setNotes((prev) => ({ ...prev, [currentQuestion.id]: note }))}
        />
      )}

      {isStatsStep && (
        <div className="wrapup-form">
          <p style={{ marginTop: 0 }}>
            Optional, but it helps keep the recap honest — a few actual numbers to check your answers against.
          </p>
          <label>
            Score (total strokes)
            <input
              type="number"
              inputMode="numeric"
              value={stats.score}
              onChange={(e) => setStats((s) => ({ ...s, score: e.target.value }))}
            />
          </label>
          <label>
            Fairways hit (out of 14)
            <input
              type="number"
              inputMode="numeric"
              value={stats.fairwaysHit}
              onChange={(e) => setStats((s) => ({ ...s, fairwaysHit: e.target.value }))}
            />
          </label>
          <label>
            Greens in regulation (out of 18)
            <input
              type="number"
              inputMode="numeric"
              value={stats.greensInRegulation}
              onChange={(e) => setStats((s) => ({ ...s, greensInRegulation: e.target.value }))}
            />
          </label>
          <label>
            Putts (total)
            <input
              type="number"
              inputMode="numeric"
              value={stats.putts}
              onChange={(e) => setStats((s) => ({ ...s, putts: e.target.value }))}
            />
          </label>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <button
        type="button"
        className="primary-button"
        style={{ marginTop: 24 }}
        disabled={!canAdvance || submitting}
        onClick={() => (isStatsStep ? handleSubmit() : setStep((s) => s + 1))}
      >
        {isStatsStep ? (submitting ? 'Generating your recap…' : 'Finish session') : 'Next'}
      </button>

      {step > 0 && (
        <button type="button" className="text-button" onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
      )}
    </div>
  )
}
