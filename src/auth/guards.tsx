import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Role } from '../types/domain'

export function RequireSession({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireProfile({ role, children }: { role: Role; children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/complete-profile" replace />
  if (profile.role !== role) {
    return <Navigate to={profile.role === 'coach' ? '/coach' : '/player'} replace />
  }
  return <>{children}</>
}

export function FullPageSpinner() {
  return (
    <div className="full-page-centered">
      <p>Loading…</p>
    </div>
  )
}
