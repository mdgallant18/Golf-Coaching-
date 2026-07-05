interface QuestionCardProps {
  prompt: string
  options: { label: string }[]
  selectedIndex: number | undefined
  onSelect: (index: number) => void
}

export function QuestionCard({ prompt, options, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div className="question-card">
      <h2>{prompt}</h2>
      <div className="option-list">
        {options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            className={`option-button${selectedIndex === index ? ' selected' : ''}`}
            onClick={() => onSelect(index)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
