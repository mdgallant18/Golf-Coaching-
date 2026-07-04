import type { Bucket, Role, SessionType } from '../types/domain'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: Role
          full_name: string
          coach_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: Role
          full_name: string
          coach_id?: string | null
          created_at?: string
        }
        Update: {
          role?: Role
          full_name?: string
          coach_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_coach_id_fkey'
            columns: ['coach_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          player_id: string
          session_type: SessionType
          bucket: Bucket
          summary: string
          recap: string
          answers: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          session_type: SessionType
          bucket: Bucket
          summary: string
          recap?: string
          answers?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          summary?: string
          recap?: string
          answers?: Record<string, unknown>
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_player_id_fkey'
            columns: ['player_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
