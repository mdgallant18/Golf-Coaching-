import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, Role } from '../types/domain'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  /** True until the initial session + profile lookup resolves. */
  loading: boolean
  refreshProfile: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  completeProfile: (input: { fullName: string; role: Role; coachId: string | null }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    setProfile(data)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) {
        await loadProfile(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return
      setSession(newSession)
      if (newSession) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      refreshProfile: async () => {
        if (session) await loadProfile(session.user.id)
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        return { needsEmailConfirmation: !data.session }
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
      completeProfile: async ({ fullName, role, coachId }) => {
        if (!session) throw new Error('No active session')
        const { error } = await supabase.from('profiles').insert({
          id: session.user.id,
          role,
          full_name: fullName,
          coach_id: role === 'player' ? coachId : null,
        })
        if (error) throw error
        await loadProfile(session.user.id)
      },
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
