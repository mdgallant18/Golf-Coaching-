import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Bucket, SessionRecord, SessionType } from '../types/domain'

async function describeFunctionsError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error) return body.detail ? `${body.error}: ${body.detail}` : body.error
    } catch {
      // fall through to generic message below
    }
  }
  return error instanceof Error ? error.message : 'Could not generate your recap.'
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
  const { data: recapData, error: recapError } = await supabase.functions.invoke('generate-recap', {
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
