import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Bucket, SessionRecord, SessionType } from '../types/domain'

async function describeFunctionsError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const status = error.context.status
    let raw = ''
    try {
      raw = await error.context.text()
    } catch (readErr) {
      return `Recap function returned status ${status}, and its response body couldn't be read (${readErr instanceof Error ? readErr.message : readErr}).`
    }
    try {
      const body = JSON.parse(raw)
      if (body?.error) {
        return body.detail ? `Recap failed: ${body.error} — ${body.detail}` : `Recap failed: ${body.error}`
      }
    } catch {
      // raw wasn't JSON — fall through and show it verbatim below
    }
    return `Recap function returned status ${status}: ${raw.slice(0, 300) || '(empty body)'}`
  }
  return `Could not reach the recap function (${error instanceof Error ? error.message : String(error)}).`
}

interface SubmitSessionInput {
  playerId: string
  playerName: string
  sessionType: SessionType
  bucket: Bucket
  answers: Record<string, unknown>
}

const RECENT_HISTORY_LIMIT = 10

async function fetchRecentHistory(playerId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_type, bucket, summary, created_at')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(RECENT_HISTORY_LIMIT)

  if (error) throw error
  return data
}

export async function submitSession({
  playerId,
  playerName,
  sessionType,
  bucket,
  answers,
}: SubmitSessionInput): Promise<SessionRecord> {
  const recentHistory = await fetchRecentHistory(playerId)

  const { data: recapData, error: recapError } = await supabase.functions.invoke('floridian-recap', {
    body: { playerName, sessionType, bucket, answers, recentHistory },
  })
  if (recapError) throw new Error(await describeFunctionsError(recapError))

  const summary: string = recapData?.summary || 'Session logged'
  const recap: string = recapData?.recap || ''

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      player_id: playerId,
      session_type: sessionType,
      bucket,
      summary,
      recap,
      answers,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchSessionById(sessionId: string): Promise<SessionRecord> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) throw error
}

export async function fetchPlayerSessions(playerId: string): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export type GameReportSessionFilter = 'all' | 'round_tournament' | 'technical_practice' | 'performance_practice'
export type GameReportTimeRange = 'last10' | 'last30days' | 'last90days' | 'alltime'

const GAME_REPORT_SAFETY_CAP = 30

export async function generateGameReport(
  playerId: string,
  playerName: string,
  filters: {
    sessionFilter?: GameReportSessionFilter
    timeRange?: GameReportTimeRange
    audience?: 'coach' | 'player'
  } = {},
): Promise<{ summary: string; report: string }> {
  const { sessionFilter = 'all', timeRange = 'last10', audience = 'coach' } = filters

  let query = supabase
    .from('sessions')
    .select('session_type, bucket, summary, recap, answers, created_at')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })

  if (sessionFilter === 'round_tournament') {
    query = query.in('session_type', ['round', 'tournament'])
  } else if (sessionFilter === 'technical_practice') {
    query = query.eq('session_type', 'technical_practice')
  } else if (sessionFilter === 'performance_practice') {
    query = query.eq('session_type', 'performance_practice')
  }

  if (timeRange === 'last10') {
    query = query.limit(RECENT_HISTORY_LIMIT)
  } else {
    if (timeRange === 'last30days' || timeRange === 'last90days') {
      const days = timeRange === 'last30days' ? 30 : 90
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', cutoff)
    }
    // Safety cap regardless of range so a long-tenured player's "all time"
    // report doesn't balloon the prompt — most recent N within the range.
    query = query.limit(GAME_REPORT_SAFETY_CAP)
  }

  const { data: sessions, error: sessionsError } = await query

  if (sessionsError) throw sessionsError
  if (!sessions || sessions.length === 0) {
    throw new Error('No sessions match that filter for this player.')
  }

  // Only forward the numeric stats sub-object per session (score, 3-putts,
  // penalties, etc.), not the full raw question/answer payload — keeps the
  // report prompt focused on real numbers without a huge transcript dump.
  const sessionsForReport = sessions.map((s) => ({
    session_type: s.session_type,
    bucket: s.bucket,
    summary: s.summary,
    recap: s.recap,
    created_at: s.created_at,
    stats: (s.answers as Record<string, unknown> | null)?.stats ?? undefined,
  }))

  const { data, error } = await supabase.functions.invoke('floridian-recap', {
    body: { mode: 'game_report', playerName, audience, sessions: sessionsForReport },
  })
  if (error) throw new Error(await describeFunctionsError(error))

  return { summary: data?.summary || '', report: data?.recap || '' }
}

export async function generateCoachSessionReport(
  session: SessionRecord,
  playerName: string,
): Promise<{ summary: string; report: string }> {
  const { data, error } = await supabase.functions.invoke('floridian-recap', {
    body: {
      mode: 'coach_session',
      playerName,
      sessionType: session.session_type,
      bucket: session.bucket,
      answers: session.answers,
    },
  })
  if (error) throw new Error(await describeFunctionsError(error))

  return { summary: data?.summary || '', report: data?.recap || '' }
}

export async function fetchProfileName(playerId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', playerId)
    .single()

  if (error) throw error
  return data.full_name
}

export async function fetchCoachRoster(coachId: string) {
  const { data: players, error: playersError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('coach_id', coachId)
    .order('full_name')

  if (playersError) throw playersError

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (sessionsError) throw sessionsError

  return { players: players ?? [], sessions: sessions ?? [] }
}
