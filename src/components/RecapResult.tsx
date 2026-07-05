interface RecapResultProps {
  summary: string
  recap: string
  onDone: () => void
}

export function RecapResult({ summary, recap, onDone }: RecapResultProps) {
  return (
    <div className="app-screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Your recap</p>
          <h1>{summary}</h1>
        </div>
      </header>

      <div className="recap-card">
        {recap.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <button type="button" className="primary-button" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
