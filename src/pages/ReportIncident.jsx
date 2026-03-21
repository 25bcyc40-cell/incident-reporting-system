import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ErrorBanner from '../components/ErrorBanner'

const CATEGORIES = ['Security Breach', 'Data Leak', 'System Outage', 'Unauthorized Access', 'Malware', 'Phishing', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function ReportIncident() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    severity: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { title, category, description, severity } = form

    if (!title || !category || !description || !severity) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('incidents').insert({
        user_id: user.id,
        title,
        category,
        description,
        severity,
        status: 'Open',
      })

      if (insertError) throw insertError

      navigate('/my-incidents')
    } catch (err) {
      console.error('[ReportIncident] Error submitting incident:', err)
      setError(err.message || 'Failed to submit incident. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Report Incident</h1>
        <p>Submit a new security incident for review by your team.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        {error && <ErrorBanner message={error} onDismiss={() => setError('')} dismissible={true} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="report-title">Incident Title *</label>
            <input
              id="report-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Unauthorized server access detected"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="report-category">Category *</label>
              <select
                id="report-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="report-severity">Severity *</label>
              <select
                id="report-severity"
                name="severity"
                value={form.severity}
                onChange={handleChange}
                required
              >
                <option value="">Select severity</option>
                {SEVERITIES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="report-description">Description *</label>
            <textarea
              id="report-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Provide detailed information about the incident..."
              rows={6}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Submitting...' : '✓ Submit Incident'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
