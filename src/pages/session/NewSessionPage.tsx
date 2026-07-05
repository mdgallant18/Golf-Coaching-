import { useNavigate } from 'react-router-dom'

const SESSION_TYPE_CARDS = [
  {
    title: 'Round of Golf',
    description: 'Log a practice or casual round.',
    to: '/player/new/round/round',
  },
  {
    title: 'Tournament Round',
    description: 'Log a competitive round.',
    to: '/player/new/round/tournament',
  },
  {
    title: 'Technical Practice',
    description: 'Range work, mechanics, drills on process.',
    to: '/player/new/technical',
  },
  {
    title: 'Performance Practice',
    description: 'On-course practice round or a drill session.',
    to: '/player/new/performance',
  },
]

export function NewSessionPage() {
  const navigate = useNavigate()

  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">New session</p>
          <h1>What are you logging?</h1>
        </div>
      </header>

      <div className="session-type-grid">
        {SESSION_TYPE_CARDS.map((card) => (
          <button
            key={card.to}
            type="button"
            className="session-type-card"
            onClick={() => navigate(card.to)}
          >
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </button>
        ))}
      </div>

      <button type="button" className="text-button" onClick={() => navigate('/player')}>
        Cancel
      </button>
    </div>
  )
}
