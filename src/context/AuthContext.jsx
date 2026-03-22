import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const initRef = useRef(false)
  const profileSyncRef = useRef(null)

  // Fetch or create profile - non-blocking
  const syncProfile = async (authUser) => {
    if (!authUser?.id) return null

    try {
      // Prevent concurrent syncs
      if (profileSyncRef.current) {
        return profileSyncRef.current
      }

      profileSyncRef.current = (async () => {
        try {
          // Try to fetch existing profile
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle()

          if (existingProfile) {
            console.log('[Auth] Profile loaded')
            return existingProfile
          }

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[Auth] Profile fetch error:', fetchError.message)
            // Return basic profile - DB trigger might create it
            return {
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              email: authUser.email,
              role: 'user',
            }
          }

          // Profile doesn't exist - create it
          console.log('[Auth] Creating new profile')
          const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              full_name: fullName,
              email: authUser.email,
              role: 'user',
            })
            .select()
            .maybeSingle()

          if (insertError) {
            console.error('[Auth] Profile creation error:', insertError.message)
            // Return basic profile object
            return {
              id: authUser.id,
              full_name: fullName,
              email: authUser.email,
              role: 'user',
            }
          }

          console.log('[Auth] Profile created')
          return newProfile || {
            id: authUser.id,
            full_name: fullName,
            email: authUser.email,
            role: 'user',
          }
        } catch (err) {
          console.error('[Auth] Profile sync error:', err.message)
          // Return basic profile to allow app to continue
          return {
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email,
            role: 'user',
          }
        } finally {
          profileSyncRef.current = null
        }
      })()

      return profileSyncRef.current
    } catch (err) {
      console.error('[Auth] Sync profile error:', err.message)
      return {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        role: 'user',
      }
    }
  }

  useEffect(() => {
    if (initRef.current) {
      console.log('[Auth] Already initialized')
      return
    }
    initRef.current = true

    let isMounted = true

    // Single listener for all auth transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (!isMounted) return

          console.log('[Auth] Auth event:', event)

          if (session?.user) {
            setUser(session.user)
            setError(null)
            setLoading(false) // Unblock UI immediately

            // Load/create profile in background
            syncProfile(session.user)
              .then(profile => {
                if (isMounted && profile) {
                  setProfile(profile)
                }
              })
              .catch(err => {
                console.error('[Auth] Profile sync failed:', err.message)
                // App continues even if profile fails
              })
          } else {
            // User not authenticated
            setUser(null)
            setProfile(null)
            setError(null)
            setLoading(false)
          }
        } catch (err) {
          console.error('[Auth] Auth listener error:', err.message)
          if (isMounted) {
            setError(err.message)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error('[Auth] Sign in error:', error.message)
        setError(error.message)
      }
      return { data, error }
    } catch (err) {
      console.error('[Auth] Sign in exception:', err.message)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        console.error('[Auth] Sign up error:', error.message)
        setError(error.message)
        return { data, error }
      }

      // Insert profile row if signup succeeded
      if (data.user) {
        console.log('[Auth] User created, creating profile')
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: 'user',
        })
        if (profileError) {
          console.error('[Auth] Error creating profile after signup:', profileError.message)
          setError(profileError.message)
          return { data, error: profileError }
        }
      }
      return { data, error: null }
    } catch (err) {
      console.error('[Auth] Sign up exception:', err.message)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const redirectUrl = `${window.location.origin}/dashboard`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'consent',
          },
        },
      })
      if (error) {
        console.error('[Auth] Google OAuth error:', error.message)
        setError(error.message)
        return { data: null, error }
      }
      return { data, error: null }
    } catch (err) {
      console.error('[Auth] Google OAuth exception:', err.message)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setError(null)
      console.log('[Auth] User signed out')
    } catch (err) {
      console.error('[Auth] Sign out error:', err.message)
      setError(err.message)
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAdmin: profile?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
