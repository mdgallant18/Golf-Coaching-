import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { fetchCoachRoster } from '../lib/sessions'
import { BUCKET_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

interface RosterPlayer {
  id: string
  full_name: string
}

export function CoachHomePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<RosterPlayer[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchCoachRoster(profile.id)
      .then(({ players, sessions }) => {
        setPlayers(players)
        setSessions(sessions)
      })
      .finally(() => setLoading(false))
  }, [profile])

  const sessionsByPlayer = new Map<string, SessionRecord[]>()
  for (const session of sessions) {
    const list = sessionsByPlayer.get(session.player_id) ?? []
    list.push(session)
    sessionsByPlayer.set(session.player_id, list)
  }

  const rosterSorted = [...players].sort((a, b) => {
    const aLatest = sessionsByPlayer.get(a.id)?.[0]?.created_at ?? ''
    const bLatest = sessionsByPlayer.get(b.id)?.[0]?.created_at ?? ''
    return bLatest.localeCompare(aLatest)
  })

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

      {loading && <p>Loading…</p>}

      {!loading && players.length === 0 && (
        <section className="placeholder-card">
          <h2>No players yet</h2>
          <p>Once players pick you as their coach at signup, they'll show up here.</p>
        </section>
      )}

      <ul className="roster-list">
        {rosterSorted.map((player) => {
          const playerSessions = sessionsByPlayer.get(player.id) ?? []
          const latest = playerSessions[0]
          return (
            <li key={player.id} className="roster-item">
              <div className="roster-item-header">
                <h2>{player.full_name}</h2>
                <span className="session-date">
                  {playerSessions.length} session{playerSessions.length === 1 ? '' : 's'}
                </span>
              </div>
              {latest ? (
                <button
                  type="button"
                  className="session-list-item session-list-item-button"
                  onClick={() => navigate(`/sessions/${latest.id}`)}
                >
                  <div className="session-list-item-header">
                    <span className="bucket-tag">{BUCKET_LABELS[latest.bucket]}</span>
                    <span className="session-date">
                      {new Date(latest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="session-summary">{latest.summary}</p>
                </button>
              ) : (
                <p>No sessions logged yet.</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
