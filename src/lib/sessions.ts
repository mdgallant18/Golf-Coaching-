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

export async function submitSession({
  playerId,
  playerName,
  sessionType,
  bucket,
  answers,
}: SubmitSessionInput): Promise<SessionRecord> {
  const { data: recapData, error: recapError } = await supabase.functions.invoke('floridian-recap', {
    body: { playerName, sessionType, bucket, answers },
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

export async function fetchPlayerSessions(playerId: string): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
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
