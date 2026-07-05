import { BUCKET_LABELS } from '../types/domain'
import type { SessionRecord } from '../types/domain'

export function computeTrendBlurb(sessions: SessionRecord[]): string | null {
  if (sessions.length === 0) return null

  const recent = sessions.slice(0, 5)
  const counts = new Map<string, number>()
  for (const session of recent) {
    counts.set(session.bucket, (counts.get(session.bucket) ?? 0) + 1)
  }

  let topBucket = recent[0].bucket
  let topCount = 0
  for (const [bucket, count] of counts) {
    if (count > topCount) {
      topCount = count
      topBucket = bucket as SessionRecord['bucket']
    }
  }

  const label = BUCKET_LABELS[topBucket]
  if (recent.length === 1) {
    return `Your last session centered on ${label}.`
  }
  return `Your last ${recent.length} sessions have leaned toward ${label} (${topCount} of ${recent.length}).`
}
