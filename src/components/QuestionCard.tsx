interface QuestionCardProps {
  prompt: string
  options: { label: string }[]
  selectedIndex: number | undefined
  onSelect: (index: number) => void
  note: string
  onNoteChange: (note: string) => void
}

export function QuestionCard({
  prompt,
  options,
  selectedIndex,
  onSelect,
  note,
  onNoteChange,
}: QuestionCardProps) {
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
      <label className="question-note">
        Anything else about this? (optional — tap the mic on your keyboard to talk it out)
        <textarea
          rows={2}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="e.g. I was aiming away from the water on 12 all day"
        />
      </label>
    </div>
  )
}
