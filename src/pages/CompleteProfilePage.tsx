import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'
import type { Role } from '../types/domain'

interface CoachOption {
  id: string
  full_name: string
}

export function CompleteProfilePage() {
  const { session, profile, completeProfile } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('player')
  const [fullName, setFullName] = useState('')
  const [coachId, setCoachId] = useState<string>('')
  const [coaches, setCoaches] = useState<CoachOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (role !== 'player') return
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'coach')
      .order('full_name')
      .then(({ data, error: fetchError }) => {
        if (!fetchError && data) setCoaches(data)
      })
  }, [role])

  // Already have a profile, or never signed in — nothing to complete here.
  if (!session) return <Navigate to="/login" replace />
  if (profile) return <Navigate to={profile.role === 'coach' ? '/coach' : '/player'} replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await completeProfile({
        fullName: fullName.trim(),
        role,
        coachId: coachId || null,
      })
      navigate(role === 'coach' ? '/coach' : '/player', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Tell us about you</h1>
        <p className="subtitle">One more step before you get started.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <fieldset className="role-fieldset">
            <legend>I am a…</legend>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="player"
                checked={role === 'player'}
                onChange={() => setRole('player')}
              />
              Player
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="role"
                value="coach"
                checked={role === 'coach'}
                onChange={() => setRole('coach')}
              />
              Coach
            </label>
          </fieldset>

          {role === 'player' && (
            <label>
              My coach
              <select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                <option value="">No coach yet / not sure</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.full_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Saving…' : 'Finish setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
