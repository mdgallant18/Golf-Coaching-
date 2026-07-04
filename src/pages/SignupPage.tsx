import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUp(email, password)
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true)
      } else {
        navigate('/complete-profile', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (needsConfirmation) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="subtitle">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and
            log in to finish setting up your account.
          </p>
          <Link to="/login" className="primary-button" style={{ display: 'inline-block', textAlign: 'center' }}>
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="subtitle">Players and coaches both start here.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Continue'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
