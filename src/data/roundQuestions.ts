import type { Bucket } from '../types/domain'

export interface QuestionOption {
  label: string
  /** 4 = best outcome, 1 = worst outcome. Used to find the session's biggest leak. */
  score: 4 | 3 | 2 | 1
}

// The causal thread behind an answer, distinct from the skill-area bucket.
// A player can be uncommitted in driving, putting, AND par-5 decisions —
// three different buckets — and the real story is "commitment," not any one
// of those locations. Buckets stay for roster/session tagging; themes let the
// recap prompt spot that cross-cutting pattern instead of defaulting to
// whichever single bucket happens to average lowest.
export type QuestionTheme = 'commitment' | 'decision_making' | 'process' | 'mental_resilience'

export interface RoundQuestion {
  id: string
  bucket: Bucket
  theme: QuestionTheme
  prompt: string
  options: QuestionOption[]
}

// One question per bucket — the fastest honest read on today's round.
// The top option always folds in the escape hatch ("committed, good or bad
// result") so a clean mis-hit on a well-committed shot scores as a good
// process, not a leak.
export const ROUND_QUESTIONS: RoundQuestion[] = [
  {
    id: 'driving',
    bucket: 'driving',
    theme: 'commitment',
    prompt: 'Off the tee today, were you committed to your target and game plan?',
    options: [
      { label: 'Committed every time — good or bad result', score: 4 },
      { label: 'Committed most of the time, hesitated on a few', score: 3 },
      { label: 'Hit-or-miss — deciding instead of trusting a plan', score: 2 },
      { label: 'Barely committed — mostly steering it', score: 1 },
    ],
  },
  {
    id: 'approach_scoring',
    bucket: 'approach_scoring',
    theme: 'commitment',
    prompt: 'On approach shots and scoring chances, did you commit to your number and go after it?',
    options: [
      { label: 'Committed and went after it every time — good or bad result', score: 4 },
      { label: 'Committed most of the time, second-guessed a few', score: 3 },
      { label: 'Second-guessed the number more than once', score: 2 },
      { label: 'Mostly guessing, not committing to a real target', score: 1 },
    ],
  },
  {
    id: 'short_game_putting',
    bucket: 'short_game_putting',
    theme: 'commitment',
    prompt: 'Around the greens and on the putting surface, did you trust your read and commit?',
    options: [
      { label: 'Trusted it and committed every time — good or bad result', score: 4 },
      { label: 'Trusted it most of the time, hesitated on a few', score: 3 },
      { label: 'Second-guessed reads or shots more than once', score: 2 },
      { label: 'Rarely trusted a read or plan — mostly reacting', score: 1 },
    ],
  },
  {
    id: 'course_strategy',
    bucket: 'course_strategy',
    theme: 'decision_making',
    prompt: 'On the tough calls — recoveries, par 5s, risky pins — did you make the smart play?',
    options: [
      { label: 'Made the smart call every time — good or bad result', score: 4 },
      { label: 'Mostly smart, one decision I’d take back', score: 3 },
      { label: 'Forced it more than once instead of taking the smart play', score: 2 },
      { label: 'Rarely had a plan — mostly reacted in the moment', score: 1 },
    ],
  },
  {
    id: 'mental_game',
    bucket: 'mental_game',
    theme: 'mental_resilience',
    prompt: 'After a bad shot or hole, did you stay in your routine and move on?',
    options: [
      { label: 'Stayed in my process and moved on every time', score: 4 },
      { label: 'Mostly stayed present, took a hole to reset once or twice', score: 3 },
      { label: 'Let a bad break creep into my head and it snowballed', score: 2 },
      { label: 'Rarely got back into my routine after a mistake', score: 1 },
    ],
  },
]
