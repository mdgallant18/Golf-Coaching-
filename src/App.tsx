import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { FullPageSpinner, RequireProfile, RequireSession } from './auth/guards'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { CompleteProfilePage } from './pages/CompleteProfilePage'
import { PlayerHomePage } from './pages/PlayerHomePage'
import { CoachHomePage } from './pages/CoachHomePage'

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
