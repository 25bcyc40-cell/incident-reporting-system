import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId, retries = 3, delay = 500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`[Auth] Fetching profile for user ${userId} (attempt ${attempt}/${retries})`)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        console.log('[Auth] Profile fetched successfully:', data.id)
        return data
      }

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means row not found, which is expected for new users
        console.error(`[Auth] Profile fetch error (attempt ${attempt}):`, error.code, error.message)
      }

      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        console.log(`[Auth] Retrying profile fetch in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      }
    }

    console.log('[Auth] Profile fetch failed after all retries')
    return null
  }

  const createProfileIfNotExists = async (user) => {
    if (!user) return null

    // Check if profile exists (with retry logic)
    console.log('[Auth] Checking if profile exists for user:', user.id)
    let profile = await fetchProfile(user.id, 3, 500)
    if (profile) {
      console.log('[Auth] Profile found, returning existing profile')
      return profile
    }

    // Create profile for new OAuth users
    console.log('[Auth] Profile not found, creating new profile for OAuth user')
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
      console.error('[Auth] Error creating profile for OAuth user:', createError)
      return null
    }
    
    console.log('[Auth] New profile created successfully:', newProfile.id)
    return newProfile
  }

  useEffect(() => {
    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Session loading timeout after 10 seconds')
        setLoading(false)
      }
    }, 10000)

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      
      console.log('[Auth] Session loaded:', session?.user?.id ? 'User found' : 'No user')
      
      if (session?.user) {
        setUser(session.user)
        const p = await createProfileIfNotExists(session.user)
        if (isMounted) {
          setProfile(p)
        }
      }
      
      if (isMounted) {
        console.log('[Auth] Auth loading complete')
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }).catch(err => {
      console.error('[Auth] Error getting session:', err)
      if (isMounted) {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('[Auth] Auth state changed:', event, session?.user?.id ? 'User found' : 'No user')
        
        if (session?.user) {
          setUser(session.user)
          const p = await createProfileIfNotExists(session.user)
          if (isMounted) {
            setProfile(p)
          }
        } else {
          setUser(null)
          setProfile(null)
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { data, error }

    // Insert profile row
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: 'user',
      })
      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { data, error: profileError }
      }
    }
    return { data, error: null }
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
        console.error('Google OAuth error:', error)
      }
      return { data, error }
    } catch (err) {
      console.error('Google OAuth sign-in failed:', err)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAdmin: profile?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
