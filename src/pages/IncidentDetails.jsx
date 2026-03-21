import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SeverityBadge, StatusBadge } from '../components/Badge'
import CommentSection from '../components/CommentSection'

const STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed']

export default function IncidentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [incident, setIncident] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const fetchIncident = useCallback(async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*, profiles(full_name, email)')
      .eq('id', id)
      .single()

    if (error || !data) {
      setIncident(null)
    } else {
      // Non-admin users can only view their own incidents
      if (!isAdmin && data.user_id !== user.id) {
        setIncident(null)
      } else {
        setIncident(data)
      }
    }
    setLoading(false)
  }, [id, isAdmin, user])

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('incident_comments')
      .select('*, profiles(full_name)')
      .eq('incident_id', id)
      .order('created_at', { ascending: true })

    if (!error) setComments(data || [])
  }, [id])

  useEffect(() => {
    fetchIncident()
    fetchComments()
  }, [fetchIncident, fetchComments])

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true)
    setStatusMsg('')

    const { error } = await supabase
      .from('incidents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setStatusMsg('Failed to update status.')
    } else {
      setIncident(prev => ({ ...prev, status: newStatus }))
      setStatusMsg('Status updated.')
      setTimeout(() => setStatusMsg(''), 3000)
    }
    setStatusUpdating(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading incident details...</p>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="access-denied">
        <div className="icon">🚫</div>
        <h2>Incident Not Found</h2>
        <p>This incident does not exist or you don't have access to view it.</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
          ← Back
        </button>
        <h1>{incident.title}</h1>
        <p>Reported by {incident.profiles?.full_name || 'Unknown'} on {formatDate(incident.created_at)}</p>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="detail-field">
            <div className="field-label">Description</div>
            <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>{incident.description}</div>
          </div>
        </div>

        <div className="card">
          <div className="detail-field">
            <div className="field-label">Category</div>
            <div className="field-value">{incident.category}</div>
          </div>
          <div className="detail-field">
            <div className="field-label">Severity</div>
            <div className="field-value"><SeverityBadge severity={incident.severity} /></div>
          </div>
          <div className="detail-field">
            <div className="field-label">Status</div>
            <div className="field-value">
              {isAdmin ? (
                <div>
                  <select
                    className="status-dropdown"
                    value={incident.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {statusMsg && <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--color-success)' }}>{statusMsg}</div>}
                </div>
              ) : (
                <StatusBadge status={incident.status} />
              )}
            </div>
          </div>
          <div className="detail-field">
            <div className="field-label">Last Updated</div>
            <div className="field-value">{formatDate(incident.updated_at || incident.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <CommentSection
          incidentId={incident.id}
          comments={comments}
          onCommentAdded={fetchComments}
        />
      </div>
    </div>
  )
}
