import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  }

  const createProfileIfNotExists = async (user) => {
    if (!user) return null

    // Check if profile exists
    let profile = await fetchProfile(user.id)
    if (profile) return profile

    // Create profile for new OAuth users
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
      console.error('Error creating profile for OAuth user:', createError)
      return null
    }
    return newProfile
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const p = await createProfileIfNotExists(session.user)
        setProfile(p)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const p = await createProfileIfNotExists(session.user)
          setProfile(p)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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
          redirectTo: window.location.origin + '/dashboard',
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
