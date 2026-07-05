import type { Bucket } from '../types/domain'

export interface QuestionOption {
  label: string
  /** 4 = best outcome, 1 = worst outcome. Used to find the session's biggest leak. */
  score: 4 | 3 | 2 | 1
}

export interface RoundQuestion {
  id: string
  bucket: Bucket
  prompt: string
  options: QuestionOption[]
}

export const ROUND_QUESTIONS: RoundQuestion[] = [
  {
    id: 'tee_shots',
    bucket: 'driving',
    prompt: 'How did your tee shots go today?',
    options: [
      { label: 'Long and in play most of the day', score: 4 },
      { label: 'Mixed — some good, some missed', score: 3 },
      { label: 'Struggled to find fairways', score: 2 },
      { label: 'Really hunting for a swing out there', score: 1 },
    ],
  },
  {
    id: 'tee_shot_mindset',
    bucket: 'mental_game',
    prompt: 'What was your mindset standing on the tee?',
    options: [
      { label: 'Committed and confident on every swing', score: 4 },
      { label: 'Solid most of the time, hesitant a few times', score: 3 },
      { label: 'Second-guessing club or target a lot', score: 2 },
      { label: 'Just trying to survive the tee shot', score: 1 },
    ],
  },
  {
    id: 'approach_shots',
    bucket: 'approach_scoring',
    prompt: 'How were your approach shots into the greens?',
    options: [
      { label: 'Sticking it close, attacking pins', score: 4 },
      { label: 'Decent numbers, in range most of the time', score: 3 },
      { label: 'Struggled with distance or club control', score: 2 },
      { label: 'Missing more greens than I hit', score: 1 },
    ],
  },
  {
    id: 'approach_commitment',
    bucket: 'mental_game',
    prompt: 'How committed were you to your approach shot plan?',
    options: [
      { label: 'Fully committed to the number and shot every time', score: 4 },
      { label: 'Committed most of the time', score: 3 },
      { label: 'Waffled between clubs or targets a lot', score: 2 },
      { label: "Rarely had a real plan", score: 1 },
    ],
  },
  {
    id: 'short_game',
    bucket: 'short_game_putting',
    prompt: 'How was your short game around the greens?',
    options: [
      { label: 'Sharp — got up and down often', score: 4 },
      { label: 'Some good, some chunked or bladed', score: 3 },
      { label: 'Struggled to get the ball close', score: 2 },
      { label: "Didn't have many looks at it today", score: 1 },
    ],
  },
  {
    id: 'putting',
    bucket: 'short_game_putting',
    prompt: 'How did the putter feel today?',
    options: [
      { label: 'Rolling it great, making the ones I should', score: 4 },
      { label: 'Solid speed, a few lip-outs', score: 3 },
      { label: 'Struggled with speed or the right read', score: 2 },
      { label: 'The putter really let me down', score: 1 },
    ],
  },
  {
    id: 'scoring_conversion',
    bucket: 'approach_scoring',
    prompt: 'How did you convert your scoring chances?',
    options: [
      { label: 'Capitalized on the birdie or par looks I had', score: 4 },
      { label: 'Converted some, left some out there', score: 3 },
      { label: 'Left most of my chances out there', score: 2 },
      { label: "Didn't have many real chances today", score: 1 },
    ],
  },
  {
    id: 'bounce_back',
    bucket: 'mental_game',
    prompt: 'After a bad shot or hole, what happened next?',
    options: [
      { label: 'Bounced back strong right away', score: 4 },
      { label: 'Took a hole or two to settle back in', score: 3 },
      { label: 'It snowballed into more mistakes', score: 2 },
      { label: 'Never really got over it', score: 1 },
    ],
  },
]

export const MENTAL_SCORECARD_OPTIONS = [
  'Very poor',
  'Poor',
  'Okay',
  'Good',
  'Very good',
] as const

export type MentalScorecardRating = (typeof MENTAL_SCORECARD_OPTIONS)[number]
