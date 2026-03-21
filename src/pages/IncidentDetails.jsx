import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { SeverityBadge, StatusBadge } from '../components/Badge'
import CommentSection from '../components/CommentSection'
import SkeletonCard from '../components/SkeletonCard'
import ErrorBanner from '../components/ErrorBanner'
import SkeletonLoader from '../components/SkeletonLoader'

const STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed']

export default function IncidentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [incident, setIncident] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const fetchIncident = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('incidents')
        .select('*, profiles(full_name, email)')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setAccessDenied(true)
          setIncident(null)
        } else {
          throw fetchError
        }
      } else if (data) {
        // Non-admin users can only view their own incidents
        if (!isAdmin && data.user_id !== user.id) {
          setAccessDenied(true)
          setIncident(null)
        } else {
          setIncident(data)
          setAccessDenied(false)
          setError(null)
        }
      }
    } catch (err) {
      console.error('[IncidentDetails] Error fetching incident:', err)
      setError(err.message || 'Failed to load incident')
      setIncident(null)
    } finally {
      setLoading(false)
    }
  }, [id, isAdmin, user?.id])

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('incident_comments')
        .select('*, profiles(full_name)')
        .eq('incident_id', id)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setComments(data || [])
    } catch (err) {
      console.error('[IncidentDetails] Error fetching comments:', err)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchIncident()
    fetchComments()
  }, [fetchIncident, fetchComments])

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true)
    setStatusMsg('')

    try {
      const { error: updateError } = await supabase
        .from('incidents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      setIncident(prev => ({ ...prev, status: newStatus }))
      setStatusMsg('✓ Status updated successfully')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err) {
      console.error('[IncidentDetails] Error updating status:', err)
      setStatusMsg('✗ Failed to update status')
      setTimeout(() => setStatusMsg(''), 3000)
    } finally {
      setStatusUpdating(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
          ← Back
        </button>
        <SkeletonLoader width="200px" height="32px" style={{ marginBottom: '12px' }} />
        <SkeletonLoader width="300px" height="18px" />
        <div style={{ marginTop: '20px' }}>
          <SkeletonCard lines={4} />
        </div>
      </div>
    )
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
          ← Back
        </button>
        <div className="access-denied">
          <div className="icon">🚫</div>
          <h2>Incident Not Found</h2>
          <p>This incident does not exist or you don't have permission to view it.</p>
          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => navigate('/my-incidents')}>
            View My Incidents
          </button>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
          ← Back
        </button>
        <ErrorBanner message={error} onRetry={fetchIncident} />
      </div>
    )
  }

  // No incident
  if (!incident) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
          ← Back
        </button>
        <div className="access-denied">
          <div className="icon">🚫</div>
          <h2>Incident Not Found</h2>
          <p>This incident no longer exists.</p>
        </div>
      </div>
    )
  }

  // Normal state
  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '12px' }}>
        ← Back
      </button>

      <div className="page-header">
        <h1>{incident.title}</h1>
        <p>
          Reported by <strong>{incident.profiles?.full_name || 'Unknown'}</strong> on{' '}
          <strong>{formatDate(incident.created_at)}</strong>
        </p>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="detail-field">
            <div className="field-label">Description</div>
            <div className="field-value" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {incident.description}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="detail-field">
            <div className="field-label">Category</div>
            <div className="field-value">
              <span style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '500' }}>
                {incident.category}
              </span>
            </div>
          </div>

          <div className="detail-field">
            <div className="field-label">Severity</div>
            <div className="field-value">
              <SeverityBadge severity={incident.severity} />
            </div>
          </div>

          <div className="detail-field">
            <div className="field-label">Status</div>
            <div className="field-value">
              {isAdmin ? (
                <div>
                  <select
                    className="status-dropdown"
                    value={incident.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    style={{ minWidth: '140px' }}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {statusMsg && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        color: statusMsg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: '500',
                      }}
                    >
                      {statusMsg}
                    </div>
                  )}
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
          loading={commentsLoading}
        />
      </div>
    </div>
  )
}
