export function toPlainText(markdown: string) {
  return markdown.replace(/^##\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1')
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function renderReportMarkdown(markdown: string) {
  const blocks = markdown
    .split(/\n(?=##\s)/)
    .map((b) => b.trim())
    .filter(Boolean)

  return blocks.map((block, i) => {
    const headerMatch = block.match(/^##\s+(.+)/)
    if (headerMatch) {
      const rest = block.slice(headerMatch[0].length).trim()
      return (
        <div key={i}>
          <h3>{headerMatch[1]}</h3>
          {rest.split('\n\n').map((p, j) => (
            <p key={j}>{renderBold(p)}</p>
          ))}
        </div>
      )
    }
    return <p key={i}>{renderBold(block)}</p>
  })
}
