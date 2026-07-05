import { useNavigate } from 'react-router-dom'

export function PerformancePracticeChoice() {
  const navigate = useNavigate()

  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Performance Practice</p>
          <h1>What kind of session was it?</h1>
        </div>
      </header>

      <div className="session-type-grid">
        <button
          type="button"
          className="session-type-card"
          onClick={() => navigate('/player/new/round/performance_practice')}
        >
          <h2>On-course practice round</h2>
          <p>Played holes, same reflection as a round.</p>
        </button>
        <button type="button" className="session-type-card" onClick={() => navigate('/player/new/drills')}>
          <h2>Drill session</h2>
          <p>Repeatable drills — club, target, goal, result.</p>
        </button>
      </div>

      <button type="button" className="text-button" onClick={() => navigate('/player/new')}>
        Back
      </button>
    </div>
  )
}
