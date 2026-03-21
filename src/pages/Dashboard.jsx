import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile?.id) {
      console.log('[Dashboard] Waiting for profile to load...')
      return
    }

    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Dashboard] Data loading timeout after 8 seconds')
        setError('Dashboard data took too long to load. Please refresh.')
        setLoading(false)
      }
    }, 8000)

    const fetchStats = async () => {
      try {
        console.log('[Dashboard] Fetching stats for user:', profile.id)
        const { data, error } = await supabase
          .from('incidents')
          .select('id, status, severity')
          .eq('user_id', profile.id)

        if (!isMounted) return

        if (error) {
          console.error('[Dashboard] Error fetching stats:', error)
          setError('Failed to load dashboard data. Please try refreshing.')
          setStats({ total: 0, open: 0, resolved: 0, critical: 0 })
        } else if (data) {
          console.log('[Dashboard] Stats fetched successfully, total incidents:', data.length)
          setStats({
            total: data.length,
            open: data.filter(i => i.status === 'Open').length,
            resolved: data.filter(i => i.status === 'Resolved').length,
            critical: data.filter(i => i.severity === 'Critical').length,
          })
          setError(null)
        } else {
          console.log('[Dashboard] No data returned')
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Dashboard] Exception fetching stats:', err)
          setError('An unexpected error occurred. Please refresh.')
          setStats({ total: 0, open: 0, resolved: 0, critical: 0 })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    }

    fetchStats()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [profile?.id])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {profile?.full_name || 'User'}. Here's your incident overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-label">Total Incidents</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔵</div>
          <div className="stat-label">Open</div>
          <div className="stat-value">{stats.open}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{stats.resolved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-label">Critical</div>
          <div className="stat-value">{stats.critical}</div>
        </div>
      </div>
    </div>
  )
}
