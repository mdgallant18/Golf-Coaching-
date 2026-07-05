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

// Each question blends process (commitment, decision-making) with outcome in a
// single graduated scale, so one tap carries both signals — no separate
// "mindset" question needed to know whether a bad outcome was a bad swing or
// a player who never picked a target in the first place.
export const ROUND_QUESTIONS: RoundQuestion[] = [
  {
    id: 'tee_shots',
    bucket: 'driving',
    prompt: 'How were your tee shots today?',
    options: [
      { label: 'Committed to a clear target and executed the swing I wanted — found the fairway or a good spot', score: 4 },
      { label: 'Committed and executed most of the time — a couple ended up offline but still playable', score: 3 },
      { label: 'Struggled to commit to a target, and it showed — mixed results, some real trouble', score: 2 },
      { label: "Wasn't picking clear targets — misses went both ways and cost me holes", score: 1 },
    ],
  },
  {
    id: 'approach_shots',
    bucket: 'approach_scoring',
    prompt: 'How were your approach shots into the greens?',
    options: [
      { label: 'Committed to the number and executed — hit my targets close', score: 4 },
      { label: 'Committed most of the time — distance or club control was slightly off but in range', score: 3 },
      { label: 'Hesitated on club or target choice — shots came up short, long, or off-line', score: 2 },
      { label: 'No real commitment to a plan — approach shots were mostly guesswork', score: 1 },
    ],
  },
  {
    id: 'short_game',
    bucket: 'short_game_putting',
    prompt: 'How was your short game around the greens?',
    options: [
      { label: 'Clear plan on every shot, committed to the landing spot — got up and down often', score: 4 },
      { label: 'Mostly committed — a few chunked or bladed when I second-guessed', score: 3 },
      { label: 'Indecisive about the shot to play — struggled to get the ball close', score: 2 },
      { label: 'No real plan around the greens — just reacting, not choosing', score: 1 },
    ],
  },
  {
    id: 'putting',
    bucket: 'short_game_putting',
    prompt: 'How did the putter feel today?',
    options: [
      { label: 'Trusted my read and committed to the line — rolled it great, made what I should', score: 4 },
      { label: 'Good speed and commitment most of the time — a few lip-outs', score: 3 },
      { label: 'Second-guessed reads or speed — inconsistent results', score: 2 },
      { label: 'Tentative on almost every putt — the putter really let me down', score: 1 },
    ],
  },
  {
    id: 'scoring_conversion',
    bucket: 'approach_scoring',
    prompt: 'How did you convert your scoring chances?',
    options: [
      { label: 'Committed to and converted the chances I had — capitalized when it mattered', score: 4 },
      { label: 'Converted some — played it safe on a few and left shots out there', score: 3 },
      { label: "Had chances but couldn't pull the trigger — left most of them out there", score: 2 },
      { label: "Didn't create many real chances to convert today", score: 1 },
    ],
  },
  {
    id: 'bounce_back',
    bucket: 'mental_game',
    prompt: 'After a bad shot or hole, what happened next?',
    options: [
      { label: 'Refocused immediately and committed to the next shot — bounced back strong', score: 4 },
      { label: 'Took a hole or two, but got recommitted and moved on', score: 3 },
      { label: "Trouble on one side of a hole made me tentative — couldn't commit, and it snowballed", score: 2 },
      { label: 'Never really got my commitment back after a bad shot or hole', score: 1 },
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
