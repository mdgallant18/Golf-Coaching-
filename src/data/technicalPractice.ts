import type { Bucket } from '../types/domain'

export const PRACTICE_AREAS = [
  'Driver',
  'Irons',
  'Wedges',
  'Putting',
  'Full swing / mechanics',
  'Mental game',
  'Course strategy',
] as const

export type PracticeArea = (typeof PRACTICE_AREAS)[number]

export const PRACTICE_AREA_BUCKETS: Record<PracticeArea, Bucket> = {
  Driver: 'driving',
  Irons: 'approach_scoring',
  Wedges: 'short_game_putting',
  Putting: 'short_game_putting',
  'Full swing / mechanics': 'driving',
  'Mental game': 'mental_game',
  'Course strategy': 'course_strategy',
}

export const RATING_OPTIONS = ['Very poor', 'Poor', 'Okay', 'Good', 'Very good'] as const
export type RatingOption = (typeof RATING_OPTIONS)[number]
