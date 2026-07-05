interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100)
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}
