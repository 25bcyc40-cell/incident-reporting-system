import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SeverityBadge, StatusBadge } from '../components/Badge'
import TableRowSkeleton from '../components/TableRowSkeleton'
import ErrorBanner from '../components/ErrorBanner'
import EmptyState from '../components/EmptyState'

export default function MyIncidents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadIncidents = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setIncidents(data || [])
    } catch (err) {
      console.error('[MyIncidents] Error loading incidents:', err)
      setError(err.message || 'Failed to load incidents')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [user?.id])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>My Incidents</h1>
          <p>Loading your incidents...</p>
        </div>
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton columns={5} count={5} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1>My Incidents</h1>
          <p>View and track all incidents you've reported.</p>
        </div>
        <ErrorBanner message={error} onRetry={loadIncidents} />
      </div>
    )
  }

  // Empty state
  if (incidents.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>My Incidents</h1>
          <p>View and track all incidents you've reported.</p>
        </div>
        <EmptyState
          icon="📋"
          title="No incidents reported yet"
          description="Start protecting your organization by reporting your first security incident."
          action={{ label: 'Report Your First Incident', onClick: () => navigate('/report-incident') }}
        />
      </div>
    )
  }

  // Normal state with data
  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>My Incidents</h1>
            <p>View and track all {incidents.length} incident{incidents.length > 1 ? 's' : ''} you've reported.</p>
          </div>
          <button
            onClick={() => navigate('/report-incident')}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            🆕 Report Incident
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(incident => (
                <tr key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)}>
                  <td>
                    <span title={incident.title}>{incident.title}</span>
                  </td>
                  <td>{incident.category}</td>
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
    </div>
  )
}
