import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Guards to prevent duplicate operations
  const initRef = useRef(false)
  const profileFetchInProgressRef = useRef({}) // Map of userId -> Promise

  // Fetch profile with optimized retry logic
  const fetchProfile = async (userId, maxRetries = 3, delayMs = 300) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() - returns null if not found

      if (data) {
        console.log('[Auth] Profile loaded successfully')
        return data
      }

      // Profile not found and needs to be created
      if (!data && !error) {
        console.log('[Auth] Profile does not exist, will create')
        return null
      }

      if (error) {
        console.error('[Auth] Profile fetch error:', error.code, error.message)
        return null
      }
    } catch (err) {
      console.error('[Auth] Exception fetching profile:', err)
      return null
    }

    return null
  }

  // Create profile for new users (OAuth or signup)
  const createProfileIfNotExists = async (user) => {
    if (!user) return null

    // Prevent duplicate profile creation for the same user
    if (profileFetchInProgressRef.current[user.id]) {
      console.log('[Auth] Profile fetch already in progress, waiting...')
      return profileFetchInProgressRef.current[user.id]
    }

    // Create a promise that tracks this operation
    const profilePromise = (async () => {
      try {
        // Try to fetch existing profile first
        let profile = await fetchProfile(user.id)
        if (profile) return profile

        // Profile doesn't exist, create it
        console.log('[Auth] Creating new profile for user:', user.id)
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            email: user.email,
            role: 'user',
          })
          .select()
          .single()

        if (createError) {
          console.error('[Auth] Error creating profile:', createError.message)
          return null
        }

        console.log('[Auth] Profile created successfully')
        return newProfile
      } catch (err) {
        console.error('[Auth] Exception in createProfileIfNotExists:', err)
        return null
      } finally {
        // Clear the in-progress marker
        delete profileFetchInProgressRef.current[user.id]
      }
    })()

    // Store the promise to prevent duplicate requests
    profileFetchInProgressRef.current[user.id] = profilePromise
    return profilePromise
  }

  useEffect(() => {
    // Guard: only initialize once
    if (initRef.current) {
      console.log('[Auth] Auth already initialized, skipping')
      return
    }
    initRef.current = true

    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Auth] Session loading timeout - proceeding without session')
        setLoading(false)
      }
    }, 5000)

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('[Auth] Initializing auth...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!isMounted) return

        if (sessionError) {
          console.error('[Auth] Session error:', sessionError.message)
          setError(sessionError.message)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }

        if (session?.user) {
          console.log('[Auth] Session found, user:', session.user.id)
          setUser(session.user)
          const profile = await createProfileIfNotExists(session.user)
          if (isMounted) {
            setProfile(profile)
            setError(null)
          }
        } else {
          console.log('[Auth] No session found')
          setUser(null)
          setProfile(null)
        }

        if (isMounted) {
          setLoading(false)
          clearTimeout(timeoutId)
        }
      } catch (err) {
        console.error('[Auth] Exception during init:', err.message)
        if (isMounted) {
          setError(err.message)
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    initAuth()

    // Listen for auth state changes (sign in/out after initial load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[Auth] Auth state changed:', event)

        if (session?.user) {
          setUser(session.user)
          const profile = await createProfileIfNotExists(session.user)
          if (isMounted) {
            setProfile(profile)
            setError(null)
            setLoading(false)
          }
        } else {
          // User signed out
          setUser(null)
          setProfile(null)
          setError(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) {
        console.error('[Auth] Google OAuth error:', error.message)
        setError(error.message)
      }
      return { data, error }
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
