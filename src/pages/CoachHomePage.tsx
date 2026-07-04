import { useAuth } from '../auth/AuthContext'

export function CoachHomePage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Coach</p>
          <h1>Welcome, {profile?.full_name?.split(' ')[0] ?? 'coach'}</h1>
        </div>
        <button className="text-button" onClick={() => signOut()}>
          Log out
        </button>
      </header>

      <section className="placeholder-card">
        <h2>Your roster view is coming next</h2>
        <p>
          Once players start logging sessions, this page will roll up every player's
          activity in one place — recent recaps, bucket trends, and who needs a check-in.
        </p>
      </section>
    </div>
  )
}
