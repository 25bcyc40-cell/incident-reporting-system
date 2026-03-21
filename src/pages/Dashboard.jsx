import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import StatCard from '../components/StatCard'
import SkeletonCard from '../components/SkeletonCard'
import ErrorBanner from '../components/ErrorBanner'
import EmptyState from '../components/EmptyState'
import { StatusBadge, SeverityBadge } from '../components/Badge'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentIncidents, setRecentIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    if (!profile?.id) return

    setLoading(true)
    setError(null)

    try {
      // Fetch stats and recent incidents in parallel with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 6000)
      )

      const fetchData = Promise.all([
        supabase
          .from('incidents')
          .select('id, status, severity')
          .eq('user_id', profile.id),
        supabase
          .from('incidents')
          .select('id, title, status, severity, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const [allIncidentsRes, recentRes] = await Promise.race([fetchData, timeoutPromise])

      if (allIncidentsRes.error) throw allIncidentsRes.error
      if (recentRes.error) throw recentRes.error

      const allIncidents = allIncidentsRes.data || []
      const recent = recentRes.data || []

      setStats({
        total: allIncidents.length,
        open: allIncidents.filter(i => i.status === 'Open').length,
        investigating: allIncidents.filter(i => i.status === 'Investigating').length,
        resolved: allIncidents.filter(i => i.status === 'Resolved').length,
        critical: allIncidents.filter(i => i.severity === 'Critical').length,
      })

      setRecentIncidents(recent)
      setError(null)
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err)
      setError(err.message || 'Failed to load dashboard data')
      setStats(null)
      setRecentIncidents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile?.id])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Render loading state with skeleton cards
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your incident overview.</p>
        </div>

        {/* Skeleton stats */}
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <StatCard
              key={i}
              icon={['📄', '🔵', '🔍', '✅'][i - 1]}
              label={['Total', 'Open', 'Investigating', 'Resolved'][i - 1]}
              value={0}
              loading={true}
            />
          ))}
        </div>

        {/* Skeleton recent incidents */}
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>Recent Incidents</h2>
          <SkeletonCard lines={5} />
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back</p>
        </div>
        <ErrorBanner message={error} onRetry={loadData} />
      </div>
    )
  }

  // Render empty state
  if (!stats || stats.total === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back! Let's get started.</p>
        </div>

        <EmptyState
          icon="📭"
          title="No incidents yet"
          description="Start by reporting your first security incident to help protect your organization."
          action={{ label: 'Report Incident', onClick: () => navigate('/report-incident') }}
        />

        {/* Quick actions are optional for empty state */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>Quick Start</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <button
              onClick={() => navigate('/report-incident')}
              style={{
                padding: '16px',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--color-primary-hover)'}
              onMouseLeave={e => e.target.style.background = 'var(--color-primary)'}
            >
              🆕 Report Incident
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render normal state with data
  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {profile?.full_name}! Here's your incident overview.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon="📄" label="Total Incidents" value={stats.total} />
        <StatCard icon="🔵" label="Open" value={stats.open} />
        <StatCard icon="🔍" label="Investigating" value={stats.investigating} />
        <StatCard icon="✅" label="Resolved" value={stats.resolved} />
      </div>

      {/* Critical incidents alert */}
      {stats.critical > 0 && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          ⚠️ You have {stats.critical} critical incident{stats.critical > 1 ? 's' : ''} that need immediate attention.
        </div>
      )}

      {/* Recent Incidents Section */}
      {recentIncidents.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Recent Incidents</h2>
            <button
              onClick={() => navigate('/my-incidents')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500',
              }}
            >
              View All →
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map(incident => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{incident.title}</td>
                    <td>
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td>
                      <StatusBadge status={incident.status} />
                    </td>
                    <td>{formatDate(incident.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions Section */}
      <div>
        <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div
            className="card"
            style={{
              padding: '16px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all var(--transition)',
            }}
            onClick={() => navigate('/report-incident')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🆕</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text)' }}>Report Incident</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Create a new incident report
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: '16px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all var(--transition)',
            }}
            onClick={() => navigate('/my-incidents')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text)' }}>My Incidents</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              View {stats.total} reported incident{stats.total > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
