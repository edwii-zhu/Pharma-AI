import { useState, useEffect } from 'react'
import { 
  User,
  Session,
  AuthError,
  UserResponse 
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null
    user: User | null
  }>
  signUp: (email: string, password: string) => Promise<{
    error: AuthError | null
    user: User | null
  }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: { user } } = await supabase.auth.getUser()
        setState({
          user,
          session,
          loading: false,
          error: null
        })
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { data: { user } } = await supabase.auth.getUser()
          setState({
            user,
            session,
            loading: false,
            error: null
          })
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null
          })
        }
      }
    )

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setState(prev => ({ ...prev, error }))
      return { error, user: null }
    }

    return { error: null, user: data.user }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setState(prev => ({ ...prev, error }))
      return { error, user: null }
    }

    return { error: null, user: data.user }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState(prev => ({ ...prev, error }))
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setState(prev => ({ ...prev, error }))
    }
    
    return { error }
  }

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
} 