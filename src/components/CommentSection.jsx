import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function CommentSection({ incidentId, comments, onCommentAdded, loading = false }) {
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('incident_comments').insert({
        incident_id: incidentId,
        user_id: user.id,
        comment: comment.trim(),
      })

      if (insertError) throw insertError

      setComment('')
      if (onCommentAdded) onCommentAdded()
    } catch (err) {
      setError(err.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="comments-section">
      <h2 style={{ marginBottom: '16px' }}>
        Comments {comments.length > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>({comments.length})</span>}
      </h2>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💬</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>No comments yet. Be the first to add one.</p>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {comments.map(c => (
            <div key={c.id} className="comment-card">
              <div className="comment-meta">
                <span className="comment-author">{c.profiles?.full_name || 'Unknown User'}</span>
                <span className="comment-date">{formatDate(c.created_at)}</span>
              </div>
              <div className="comment-body">{c.comment}</div>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={submitting}
          style={{ minHeight: '80px' }}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || !comment.trim()}>
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  )
}
