interface RatingScaleProps {
  label: string
  options: readonly string[]
  value: string | undefined
  onChange: (value: string) => void
}

export function RatingScale({ label, options, value, onChange }: RatingScaleProps) {
  return (
    <div className="rating-scale">
      <label>{label}</label>
      <div className="rating-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`rating-option${value === option ? ' selected' : ''}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
