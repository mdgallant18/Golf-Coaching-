import html2canvas from 'html2canvas'

type ShareableNavigator = Navigator & {
  canShare?: (data: { files?: File[] }) => boolean
}

export async function shareNodeAsImage(
  node: HTMLElement,
  filename: string,
  title: string,
  text: string,
): Promise<'shared' | 'downloaded'> {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render image'))), 'image/png'),
  )
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as ShareableNavigator

  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
