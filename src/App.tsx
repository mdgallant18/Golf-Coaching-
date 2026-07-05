import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { FullPageSpinner, RequireProfile, RequireSession } from './auth/guards'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { CompleteProfilePage } from './pages/CompleteProfilePage'
import { PlayerHomePage } from './pages/PlayerHomePage'
import { CoachHomePage } from './pages/CoachHomePage'
import { NewSessionPage } from './pages/session/NewSessionPage'
import { RoundSessionFlow } from './pages/session/RoundSessionFlow'
import { TechnicalPracticeFlow } from './pages/session/TechnicalPracticeFlow'
import { PerformancePracticeChoice } from './pages/session/PerformancePracticeChoice'
import { DrillLoggerFlow } from './pages/session/DrillLoggerFlow'

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/complete-profile" replace />
  return <Navigate to={profile.role === 'coach' ? '/coach' : '/player'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/complete-profile"
        element={
          <RequireSession>
            <CompleteProfilePage />
          </RequireSession>
        }
      />
      <Route
        path="/player"
        element={
          <RequireProfile role="player">
            <PlayerHomePage />
          </RequireProfile>
        }
      />
      <Route
        path="/coach"
        element={
          <RequireProfile role="coach">
            <CoachHomePage />
          </RequireProfile>
        }
      />
      <Route
        path="/player/new"
        element={
          <RequireProfile role="player">
            <NewSessionPage />
          </RequireProfile>
        }
      />
      <Route
        path="/player/new/round/:sessionType"
        element={
          <RequireProfile role="player">
            <RoundSessionFlow />
          </RequireProfile>
        }
      />
      <Route
        path="/player/new/technical"
        element={
          <RequireProfile role="player">
            <TechnicalPracticeFlow />
          </RequireProfile>
        }
      />
      <Route
        path="/player/new/performance"
        element={
          <RequireProfile role="player">
            <PerformancePracticeChoice />
          </RequireProfile>
        }
      />
      <Route
        path="/player/new/drills"
        element={
          <RequireProfile role="player">
            <DrillLoggerFlow />
          </RequireProfile>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
