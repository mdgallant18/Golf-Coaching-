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

// Each question blends process (commitment, decision-making) with outcome in a
// single graduated scale, so one tap carries both signals. Every question also
// includes an explicit escape hatch ("did everything right, it just didn't
// come off") scored the same as the top tier — without it, a clean mis-hit on
// a well-committed shot has no honest home and drags the score down as if it
// were a commitment problem, which it isn't.
export const ROUND_QUESTIONS: RoundQuestion[] = [
  {
    id: 'tee_shots',
    bucket: 'driving',
    theme: 'commitment',
    prompt: 'Off the tee today, were you committed to your targets?',
    options: [
      { label: 'Every time — picked a target, trusted it, and let it go', score: 4 },
      { label: 'Committed fully on my misses too — they just didn’t come off', score: 4 },
      { label: 'Most of the time — a couple I didn’t fully commit to', score: 3 },
      { label: 'Hit-or-miss — I was deciding on some tee shots instead of trusting a plan', score: 2 },
      { label: 'Barely committed all day — I was steering it, not swinging', score: 1 },
    ],
  },
  {
    id: 'tee_game_plan',
    bucket: 'driving',
    theme: 'decision_making',
    prompt: 'Did you have a game plan off the tee, or just grab driver?',
    options: [
      { label: 'Picked the smart club and shot shape for the hole every time — played away from trouble on purpose', score: 4 },
      { label: 'Had the right plan and still ended up in trouble a couple times', score: 4 },
      { label: 'Had a plan most of the time — a few holes I just grabbed driver without thinking it through', score: 3 },
      { label: 'Rarely thought past "hit driver" — didn’t consider the trouble on the hole', score: 2 },
      { label: 'No game plan off the tee today — just swinging away each time', score: 1 },
    ],
  },
  {
    id: 'approach_shots',
    bucket: 'approach_scoring',
    theme: 'commitment',
    prompt: 'How did you attack your approach shots?',
    options: [
      { label: 'Picked the number, committed, and went after it — hit close when it mattered', score: 4 },
      { label: 'Committed to the right number and still missed — good swing, bad result', score: 4 },
      { label: 'Mostly committed — a little tentative on distance or club a few times', score: 3 },
      { label: 'Second-guessed the number more than once — shots came up short or long', score: 2 },
      { label: 'Wasn’t picking real targets — mostly guessing with the club in my hand', score: 1 },
    ],
  },
  {
    id: 'scoring_conversion',
    bucket: 'approach_scoring',
    theme: 'commitment',
    prompt: 'When you had a real scoring chance, what happened?',
    options: [
      { label: 'Committed and converted — capitalized when it mattered', score: 4 },
      { label: 'Committed fully to the right play — the putt or shot just didn’t drop', score: 4 },
      { label: 'Converted some — played it safe on a few and left shots out there', score: 3 },
      { label: 'Had chances but couldn’t pull the trigger — left most of them out there', score: 2 },
      { label: 'Didn’t create many real chances to convert today', score: 1 },
    ],
  },
  {
    id: 'short_game',
    bucket: 'short_game_putting',
    theme: 'commitment',
    prompt: 'Around the greens, did you commit to a plan or react?',
    options: [
      { label: 'Clear shot every time, committed to the landing spot — got up and down when I needed to', score: 4 },
      { label: 'Committed to the right shot and still didn’t get it close', score: 4 },
      { label: 'Mostly had a plan — a couple I rushed or second-guessed', score: 3 },
      { label: 'More reacting than deciding — struggled to settle on a shot', score: 2 },
      { label: 'No real plan around the greens today — just reacting', score: 1 },
    ],
  },
  {
    id: 'putting',
    bucket: 'short_game_putting',
    theme: 'commitment',
    prompt: 'On the greens, did you trust your reads?',
    options: [
      { label: 'Trusted every read and rolled it with confidence — made what I should', score: 4 },
      { label: 'Trusted my read and hit my line — it just didn’t go in', score: 4 },
      { label: 'Trusted most reads — a few lip-outs, but good speed overall', score: 3 },
      { label: 'Second-guessed reads or backed off speed — inconsistent', score: 2 },
      { label: 'Tentative on almost everything — didn’t trust a read all day', score: 1 },
    ],
  },
  {
    id: 'par3_strategy',
    bucket: 'course_strategy',
    theme: 'decision_making',
    prompt: 'On par 3s, where did you aim?',
    options: [
      { label: 'Played to the smart, safe part of the green all day — only attacked pins that were actually gettable', score: 4 },
      { label: 'Picked the right target and still missed the green', score: 4 },
      { label: 'Mostly smart — went at a tucked pin once or twice I should’ve left alone', score: 3 },
      { label: 'Went at pins I shouldn’t have more than once, and it cost me strokes', score: 2 },
      { label: 'Fired at every flag regardless of where the trouble was', score: 1 },
    ],
  },
  {
    id: 'par4_recovery',
    bucket: 'course_strategy',
    theme: 'decision_making',
    prompt: 'When you were out of position on a par 4, what did you do?',
    options: [
      { label: 'Took the smart route back into play every time — protected bogey instead of chasing a big number', score: 4 },
      { label: 'Made the smart call and still made bogey or worse — that’s golf', score: 4 },
      { label: 'Mostly smart — forced one recovery shot I shouldn’t have', score: 3 },
      { label: 'Tried the hero shot more than once instead of taking my medicine', score: 2 },
      { label: 'Always went for the impossible shot — turned bogeys into doubles or worse', score: 1 },
    ],
  },
  {
    id: 'par5_go_for_it',
    bucket: 'course_strategy',
    theme: 'decision_making',
    prompt: 'On par 5s, how did you decide whether to go for it?',
    options: [
      { label: 'Went for it when the lie and numbers said yes, laid up smart when they didn’t', score: 4 },
      { label: 'Made the right call and the shot just didn’t come off', score: 4 },
      { label: 'Mostly good calls — one decision I’d take back', score: 3 },
      { label: 'Went for greens I had no business going for, or laid up when I should’ve attacked', score: 2 },
      { label: 'Never really had a plan — just reacted in the moment on every par 5', score: 1 },
    ],
  },
  {
    id: 'bounce_back',
    bucket: 'mental_game',
    theme: 'mental_resilience',
    prompt: 'After a bad shot or hole, what happened next?',
    options: [
      { label: 'Accepted it and moved on immediately — one shot at a time, all day', score: 4 },
      { label: 'Stayed present even though the next shot or two didn’t go my way either', score: 4 },
      { label: 'Took a hole to get over it, but got back into the process', score: 3 },
      { label: 'Let one side of a hole creep into my head — got tentative and it snowballed', score: 2 },
      { label: 'Never really got my commitment back after a bad break', score: 1 },
    ],
  },
  {
    id: 'routine',
    bucket: 'mental_game',
    theme: 'process',
    prompt: 'Did your routine hold up today?',
    options: [
      { label: 'Stuck to it on almost every shot — stayed present and let it do the work', score: 4 },
      { label: 'Went through my full routine even on shots that didn’t work out', score: 4 },
      { label: 'Mostly stuck to it — rushed a few times but got back to it', score: 3 },
      { label: 'Rushed or skipped it when I got frustrated — reacted more than I prepared', score: 2 },
      { label: 'Barely had a routine today — mostly reacting', score: 1 },
    ],
  },
]
