export type Role = 'coach' | 'player'

export type SessionType =
  | 'round'
  | 'tournament'
  | 'technical_practice'
  | 'performance_practice'

export type Bucket =
  | 'driving'
  | 'approach_scoring'
  | 'short_game_putting'
  | 'mental_game'
  | 'course_strategy'

export const BUCKET_LABELS: Record<Bucket, string> = {
  driving: 'Driving',
  approach_scoring: 'Approach & Scoring',
  short_game_putting: 'Short Game & Putting',
  mental_game: 'Mental Game',
  course_strategy: 'Course Strategy',
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  round: 'Round of Golf',
  tournament: 'Tournament Round',
  technical_practice: 'Technical Practice',
  performance_practice: 'Performance Practice',
}

export interface Profile {
  id: string
  role: Role
  full_name: string
  coach_id: string | null
  created_at: string
}

export interface SessionRecord {
  id: string
  player_id: string
  session_type: SessionType
  bucket: Bucket
  summary: string
  recap: string
  answers: Record<string, unknown>
  created_at: string
}
