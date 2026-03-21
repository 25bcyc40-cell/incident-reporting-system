import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch profile with optimized retry logic
  const fetchProfile = async (userId, maxRetries = 3, delayMs = 300) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (data) {
          console.log('[Auth] Profile loaded successfully')
          return data
        }

        // PGRST116 = row not found (expected for very new profiles)
        if (error && error.code === 'PGRST116' && attempt < maxRetries) {
          console.log(`[Auth] Profile not yet synced, retrying in ${delayMs}ms...`)
          await new Promise(r => setTimeout(r, delayMs))
        } else if (error) {
          console.error('[Auth] Profile fetch error:', error.code)
          break
        }
      } catch (err) {
        console.error('[Auth] Exception fetching profile:', err)
        if (attempt === maxRetries) break
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
    return null
  }

  // Create profile for new OAuth users
  const createProfileIfNotExists = async (user) => {
    if (!user) return null

    // Try to fetch existing profile first
    let profile = await fetchProfile(user.id, 3, 300)
    if (profile) return profile

    // If profile doesn't exist, create it for new OAuth users
    try {
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
        console.error('[Auth] Error creating profile:', createError)
        return null
      }

      console.log('[Auth] Profile created for new user')
      return newProfile
    } catch (err) {
      console.error('[Auth] Exception creating profile:', err)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true
    
    // Fast auth load timeout (5 seconds is more reasonable than 10)
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Session loading timeout')
        setLoading(false)
      }
    }, 5000)

    // Get initial session immediately
    const initAuth = async () => {
      try {
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
          setUser(session.user)
          const profile = await createProfileIfNotExists(session.user)
          if (isMounted) {
            setProfile(profile)
            setError(null)
          }
        }

        if (isMounted) {
          setLoading(false)
          clearTimeout(timeoutId)
        }
      } catch (err) {
        console.error('[Auth] Exception during init:', err)
        if (isMounted) {
          setError(err.message)
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    initAuth()

    // Listen for auth state changes
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
          }
        } else {
          setUser(null)
          setProfile(null)
          setError(null)
        }

        if (isMounted) {
          setLoading(false)
          clearTimeout(timeoutId)
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      return { data, error }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        return { data, error }
      }

      // Insert profile row
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: 'user',
        })
        if (profileError) {
          console.error('[Auth] Error creating profile after signup:', profileError)
          setError(profileError.message)
          return { data, error: profileError }
        }
      }
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) {
        console.error('[Auth] Google OAuth error:', error)
        setError(error.message)
      }
      return { data, error }
    } catch (err) {
      console.error('[Auth] Google OAuth sign-in failed:', err)
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
    } catch (err) {
      console.error('[Auth] Sign out error:', err)
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
