import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('id, status, severity')
        .eq('user_id', profile?.id)

      if (!error && data) {
        setStats({
          total: data.length,
          open: data.filter(i => i.status === 'Open').length,
          resolved: data.filter(i => i.status === 'Resolved').length,
          critical: data.filter(i => i.severity === 'Critical').length,
        })
      }
      setLoading(false)
    }

    if (profile?.id) fetchStats()
  }, [profile])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
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
