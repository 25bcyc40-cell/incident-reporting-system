import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function CommentSection({ incidentId, comments, onCommentAdded }) {
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase.from('incident_comments').insert({
      incident_id: incidentId,
      user_id: user.id,
      comment: comment.trim(),
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setComment('')
      if (onCommentAdded) onCommentAdded()
    }
    setSubmitting(false)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="comments-section">
      <h2>Comments ({comments.length})</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {comments.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px' }}>
          <p>No comments yet. Be the first to add one.</p>
        </div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="comment-card">
            <div className="comment-meta">
              <span className="comment-author">
                {c.profiles?.full_name || 'Unknown User'}
              </span>
              <span className="comment-date">{formatDate(c.created_at)}</span>
            </div>
            <div className="comment-body">{c.comment}</div>
          </div>
        ))
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || !comment.trim()}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  )
}
