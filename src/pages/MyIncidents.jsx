import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SeverityBadge, StatusBadge } from '../components/Badge'

export default function MyIncidents() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setIncidents(data || [])
      setLoading(false)
    }

    if (user?.id) fetchIncidents()
  }, [user])

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading incidents...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Incidents</h1>
        <p>View and track all incidents you've reported.</p>
      </div>

      {incidents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>You haven't reported any incidents yet.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/report-incident')}
          >
            Report Your First Incident
          </button>
        </div>
      ) : (
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
                {incidents.map((inc) => (
                  <tr key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}>
                    <td>{inc.title}</td>
                    <td>{inc.category}</td>
                    <td><SeverityBadge severity={inc.severity} /></td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td>{formatDate(inc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
