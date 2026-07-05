interface MultiSelectChipsProps {
  options: readonly string[]
  selected: string[]
  onToggle: (option: string) => void
}

export function MultiSelectChips({ options, selected, onToggle }: MultiSelectChipsProps) {
  return (
    <div className="chip-list">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip${selected.includes(option) ? ' selected' : ''}`}
          onClick={() => onToggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
