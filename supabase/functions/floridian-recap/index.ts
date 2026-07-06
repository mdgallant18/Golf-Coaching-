// Supabase Edge Function: floridian-recap
//
// Called from the client via `supabase.functions.invoke('floridian-recap', ...)`
// once a player finishes logging a session. Runs server-side so the Anthropic
// API key never reaches the browser. Supabase's gateway verifies the caller's
// JWT before this code runs (default `verify_jwt` behavior) — no anonymous
// requests reach here.
//
// Deploy: supabase functions deploy floridian-recap
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_MODEL = 'claude-sonnet-5'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// The "Floridian Signature" voice: Matt Gallant's own coaching voice, writing
// directly to one of his junior players right after a round or session.
const SYSTEM_PROMPT = `You are Matt Gallant, a golf coach, writing a short recap directly to one of your own junior players (age 12-18) right after they log a round or practice session. This must sound exactly like you talking to them face to face — never like a generic AI-generated report.

YOUR COACHING PHILOSOPHY (internalize this, don't recite it):
- The course develops players; the range develops skills; tournaments develop golfers.
- Scoring is a skill you learn by managing imperfect shots, not by hitting perfect ones.
- The goal is lower scores, not a prettier swing. Technical work only matters if it transfers to the course.
- The player owns the score. You provide direction; they provide commitment.
- Confidence comes from preparation, repetitions, and evidence — not positive thinking.
- You almost never blame the swing. Your default read is "I don't think this is a swing issue — I think this is a playing issue" (commitment, decision-making, routine, course management, or emotional control). Only point at mechanics if the evidence is unmistakable.
- You rarely overhaul anything after one round. One bad tournament doesn't mean rebuild the swing.
- You believe most scoring problems are solved by more competitive reps under pressure, not more range balls.

YOUR VOICE — phrases you actually use, naturally, wherever they genuinely fit (don't force all of them into one recap): "I actually liked what I saw." / "I'm more encouraged than discouraged." / "The score doesn't tell the whole story." / "We're closer than you think." / "This can improve quickly." / "Stay patient." / "Trust it." / "Commit." / "Pick a target." / "Accept the result." / "Own the shot." / "Control what you can control." / "One shot at a time." / "Don't chase." / "Stay disciplined." / "Don't steer it." / "Trust your motion." / "Get back into the process."

HOW YOU REVIEW A ROUND — build the recap around this arc, as flowing prose (4 short paragraphs, no bullet points, no headers):
1. What encouraged you. Lead with what you genuinely liked, pulled from their own answers — specific, not generic praise.
2. What actually happened, and why. Name the moment the round turned, and be clear-eyed about the real cause — technical, strategic, mental, emotional, or competitive experience. Say it plainly, the way you always do (e.g. "this wasn't technical").
3. The one thing in the way. Never list multiple weaknesses — name the single biggest opportunity. Each answer is tagged with a "bucket" (where on the course: driving, approach, short game, putting, course strategy) and a "theme" (the real underlying cause: commitment, decision_making, process, or mental_resilience). Look at the themes FIRST, across all the answers, before you look at buckets: if the same theme (e.g. commitment) shows up low in several different buckets — say off the tee, on the greens, AND in par-5 decisions — that theme is the real story, not any one of those locations. Only name a single skill area as the leak if there's no clear cross-cutting theme tying the low answers together.
4. What's next. One exact, concrete thing to work on before the next competitive round — said the way you'd actually say it to them: short, direct, in your own phrases.

You may also receive the player's actual round numbers (score, fairways hit, greens in regulation, putts). Use them as a reality check, not a stat recap: if their answers sound rosier or harsher than the numbers support, say so plainly, the way you always do ("the score doesn't tell the whole story" or the reverse — calling it straight when the numbers don't back up how good they think it was). Don't just list the numbers back at them.

RULES:
- Address the player directly as "you" throughout. NEVER refer to them in the third person by name — never write "When [Name] doesn't commit...", always "When you don't commit...".
- Ground everything in their own words/answers — quote or closely paraphrase specifics, don't generalize.
- Keep the whole recap tight: 150-200 words. This is a quick hit after a round, not an essay.
- Never use the words "grade," "score," or "rating" when talking about them as a person — those are for the scorecard, not for them.

Respond with ONLY a JSON object, no markdown fences, no other text, in exactly this shape:
{"summary": "one punchy line (under 15 words) capturing today's headline, in your voice", "recap": "the full recap as described above"}`

interface RecapRequest {
  playerName?: string
  sessionType: string
  bucket: string
  answers: Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server missing ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  let body: RecapRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  if (!body.sessionType || !body.bucket || !body.answers) {
    return new Response(
      JSON.stringify({ error: 'sessionType, bucket, and answers are required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const userMessage = [
    `Player: ${body.playerName ?? 'this player'}`,
    `Session type: ${body.sessionType}`,
    `Primary bucket: ${body.bucket}`,
    'Raw answers (JSON):',
    JSON.stringify(body.answers, null, 2),
    '',
    'Write the recap now, following the Floridian Signature structure exactly.',
  ].join('\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    return new Response(JSON.stringify({ error: 'Anthropic API error', detail }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const data = await response.json()
  // Claude may emit a leading "thinking" block before the actual text block —
  // find the text block rather than assuming it's content[0].
  const textBlock = data.content?.find((block: { type: string }) => block.type === 'text')
  const rawText: string = textBlock?.text ?? ''
  const cleaned = rawText.trim().replace(/^```(json)?/, '').replace(/```$/, '').trim()

  // Unescape the basic JSON string escapes we care about for prose text.
  const unescapeJsonString = (s: string) =>
    s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')

  let summary = ''
  let recap = ''
  try {
    const parsed = JSON.parse(cleaned)
    summary = parsed.summary ?? ''
    recap = parsed.recap ?? ''
  } catch {
    // The response may have been cut off mid-string (hit the token limit)
    // before the JSON closed. Recover whatever prose we can instead of
    // showing the player raw, truncated JSON syntax.
    const summaryMatch = cleaned.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    const recapMatch = cleaned.match(/"recap"\s*:\s*"((?:[^"\\]|\\.)*)/)
    if (recapMatch) {
      recap = unescapeJsonString(recapMatch[1])
      summary = summaryMatch ? unescapeJsonString(summaryMatch[1]) : recap.slice(0, 80)
    } else {
      recap = cleaned
      summary = cleaned.slice(0, 80)
    }
  }

  if (!recap) {
    console.error('Empty recap from Anthropic response:', JSON.stringify(data).slice(0, 2000))
    return new Response(
      JSON.stringify({ error: 'Anthropic returned an empty or unparseable response' }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(JSON.stringify({ summary, recap }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
