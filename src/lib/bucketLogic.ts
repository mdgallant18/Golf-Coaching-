import type { Bucket } from '../types/domain'
import { ROUND_QUESTIONS } from '../data/roundQuestions'

/**
 * Given the round/tournament answers (question id -> selected option index),
 * find the bucket with the lowest average score — that's the session's
 * biggest leak, and doubles as its shared-bucket tag.
 */
export function bucketFromRoundAnswers(answers: Record<string, number>): Bucket {
  const totals = new Map<Bucket, { sum: number; count: number }>()

  for (const question of ROUND_QUESTIONS) {
    const selectedIndex = answers[question.id]
    if (selectedIndex === undefined) continue
    const option = question.options[selectedIndex]
    const entry = totals.get(question.bucket) ?? { sum: 0, count: 0 }
    entry.sum += option.score
    entry.count += 1
    totals.set(question.bucket, entry)
  }

  let worstBucket: Bucket = 'mental_game'
  let worstAverage = Infinity
  for (const [bucket, { sum, count }] of totals) {
    const average = sum / count
    if (average < worstAverage) {
      worstAverage = average
      worstBucket = bucket
    }
  }
  return worstBucket
}
