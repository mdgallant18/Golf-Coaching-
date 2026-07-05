import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { QuestionCard } from '../../components/QuestionCard'
import { ProgressBar } from '../../components/ProgressBar'
import { RatingScale } from '../../components/RatingScale'
import { ROUND_QUESTIONS, MENTAL_SCORECARD_OPTIONS } from '../../data/roundQuestions'
import { bucketFromRoundAnswers } from '../../lib/bucketLogic'
import { submitSession } from '../../lib/sessions'
import { SESSION_TYPE_LABELS } from '../../types/domain'
import type { SessionType } from '../../types/domain'
import { RecapResult } from '../../components/RecapResult'

const ROUND_LIKE_TYPES: SessionType[] = ['round', 'tournament', 'performance_practice']

interface WrapUp {
  turningPoint: string
  strengths: string
  weaknesses: string
  tomorrowFocus: string
  mentalScorecard: string
}

const EMPTY_WRAPUP: WrapUp = {
  turningPoint: '',
  strengths: '',
  weaknesses: '',
  tomorrowFocus: '',
  mentalScorecard: '',
}

export function RoundSessionFlow() {
  const { sessionType: sessionTypeParam } = useParams<{ sessionType: string }>()
  const sessionType: SessionType = ROUND_LIKE_TYPES.includes(sessionTypeParam as SessionType)
    ? (sessionTypeParam as SessionType)
    : 'round'

  const { profile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0) // 0..5 questions, 6 = wrap-up
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [wrapUp, setWrapUp] = useState<WrapUp>(EMPTY_WRAPUP)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ summary: string; recap: string } | null>(null)

  const totalSteps = ROUND_QUESTIONS.length + 1
  const isWrapUpStep = step === ROUND_QUESTIONS.length
  const currentQuestion = ROUND_QUESTIONS[step]
  const canAdvance = !isWrapUpStep && answers[currentQuestion?.id] !== undefined

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
          return [q.id, note ? { answer: label, note } : { answer: label }]
        }).filter(([, v]) => v),
      )
      const payload = {
        questions: answerDetails,
        ...wrapUp,
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
          <h1>{isWrapUpStep ? 'Wrap up' : `Question ${step + 1} of ${ROUND_QUESTIONS.length}`}</h1>
        </div>
      </header>

      <ProgressBar current={step + 1} total={totalSteps} />

      {!isWrapUpStep && (
        <>
          <QuestionCard
            prompt={currentQuestion.prompt}
            options={currentQuestion.options}
            selectedIndex={answers[currentQuestion.id]}
            onSelect={(index) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }))}
            note={notes[currentQuestion.id] ?? ''}
            onNoteChange={(note) => setNotes((prev) => ({ ...prev, [currentQuestion.id]: note }))}
          />
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: 24 }}
            disabled={!canAdvance}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        </>
      )}

      {isWrapUpStep && (
        <div className="wrapup-form">
          <label>
            Where did the round turn?
            <textarea
              rows={3}
              value={wrapUp.turningPoint}
              onChange={(e) => setWrapUp((w) => ({ ...w, turningPoint: e.target.value }))}
            />
          </label>
          <label>
            What were your biggest strengths today?
            <textarea
              rows={2}
              value={wrapUp.strengths}
              onChange={(e) => setWrapUp((w) => ({ ...w, strengths: e.target.value }))}
            />
          </label>
          <label>
            What were your biggest weaknesses today?
            <textarea
              rows={2}
              value={wrapUp.weaknesses}
              onChange={(e) => setWrapUp((w) => ({ ...w, weaknesses: e.target.value }))}
            />
          </label>
          <label>
            What's tomorrow's focus?
            <textarea
              rows={2}
              value={wrapUp.tomorrowFocus}
              onChange={(e) => setWrapUp((w) => ({ ...w, tomorrowFocus: e.target.value }))}
            />
          </label>
          <RatingScale
            label="Mental scorecard — how did your head feel out there?"
            options={MENTAL_SCORECARD_OPTIONS}
            value={wrapUp.mentalScorecard || undefined}
            onChange={(value) => setWrapUp((w) => ({ ...w, mentalScorecard: value }))}
          />

          {error && <p className="form-error">{error}</p>}

          <button
            type="button"
            className="primary-button"
            disabled={submitting || !wrapUp.mentalScorecard}
            onClick={handleSubmit}
          >
            {submitting ? 'Generating your recap…' : 'Finish session'}
          </button>
        </div>
      )}

      {step > 0 && (
        <button type="button" className="text-button" onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
      )}
    </div>
  )
}
