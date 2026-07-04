import { useAuth } from '../auth/AuthContext'

export function PlayerHomePage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Player</p>
          <h1>Hey, {profile?.full_name?.split(' ')[0] ?? 'there'}</h1>
        </div>
        <button className="text-button" onClick={() => signOut()}>
          Log out
        </button>
      </header>

      <section className="placeholder-card">
        <h2>Session logging is coming next</h2>
        <p>
          Auth and your account are set up. The next phase adds the four session types
          (Round, Tournament, Technical Practice, Performance Practice), the quick-tap
          question flow, and your AI-generated recap history here.
        </p>
      </section>
    </div>
  )
}
