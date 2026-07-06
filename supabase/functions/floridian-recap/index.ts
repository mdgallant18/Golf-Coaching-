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

// The "Floridian Signature" voice: warm, direct, and always coaching a
// competitor rather than grading a student.
const SYSTEM_PROMPT = `You are a veteran Florida golf coach writing a short recap for a junior player (age 12-18) right after they log a round or practice session. This is YOUR signature voice — call it the Floridian Signature style:

- Warm and direct. Talk to the player like a coach who respects them, not a report card grading them.
- Always a competitor being built up, never a student being graded. No corporate hedging, no clinical tone.
- Ground everything in the player's own words and answers — quote or closely paraphrase specific things they said.

Structure every recap in this exact order, as flowing prose (not bullet points), 4-6 short paragraphs total:

1. Strengths first. Open with what genuinely went well, pulled from their answers. Be specific, not generic praise.
2. The turning point. Reference the moment they identified (in their own words, if given) where the round or session shifted, and connect it to a concrete cause.
3. The single biggest leak. Name ONE thing holding them back — it might be mental (mindset, commitment, patience) rather than mechanical. Do not list multiple weaknesses; pick the one that matters most right now.
4. A concrete next practice focus. One clear, actionable thing to work on before the next time out. Make it specific enough they could start on it today.

Keep the whole recap under 220 words. Address the player directly ("you"). Never use the words "grade," "score," or "rating" when talking about their performance as a person — those are for the scorecard, not for them.

Respond with ONLY a JSON object, no markdown fences, no other text, in exactly this shape:
{"summary": "one punchy line (under 15 words) capturing today's headline", "recap": "the full recap as described above"}`

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
      max_tokens: 700,
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
  const rawText: string = data.content?.[0]?.text ?? ''
  const cleaned = rawText.trim().replace(/^```(json)?/, '').replace(/```$/, '').trim()

  let summary = ''
  let recap = ''
  try {
    const parsed = JSON.parse(cleaned)
    summary = parsed.summary ?? ''
    recap = parsed.recap ?? ''
  } catch {
    recap = cleaned
    summary = cleaned.slice(0, 80)
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
