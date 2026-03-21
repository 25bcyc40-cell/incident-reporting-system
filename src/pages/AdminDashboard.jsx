import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SeverityBadge, StatusBadge } from '../components/Badge'

const STATUSES = ['All', 'Open', 'Investigating', 'Resolved', 'Closed']
const SEVERITIES = ['All', 'Low', 'Medium', 'High', 'Critical']
const CATEGORIES = ['All', 'Security Breach', 'Data Leak', 'System Outage', 'Unauthorized Access', 'Malware', 'Phishing', 'Other']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'All', severity: 'All', category: 'All' })
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 })

  useEffect(() => {
    const fetchAll = async () => {
      let query = supabase
        .from('incidents')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

      if (filters.status !== 'All') query = query.eq('status', filters.status)
      if (filters.severity !== 'All') query = query.eq('severity', filters.severity)
      if (filters.category !== 'All') query = query.eq('category', filters.category)

      const { data, error } = await query
      if (!error) {
        setIncidents(data || [])
      }
      setLoading(false)
    }

    fetchAll()
  }, [filters])

  // Fetch stats once (unfiltered)
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('incidents').select('id, status, severity')
      if (data) {
        setStats({
          total: data.length,
          open: data.filter(i => i.status === 'Open').length,
          resolved: data.filter(i => i.status === 'Resolved').length,
          critical: data.filter(i => i.severity === 'Critical').length,
        })
      }
    }
    fetchStats()
  }, [])

  const handleFilterChange = (key, value) => {
    setLoading(true)
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage all incidents across the system.</p>
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

      <div className="card">
        <div className="filter-bar">
          <select
            id="admin-filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select
            id="admin-filter-severity"
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s}</option>)}
          </select>
          <select
            id="admin-filter-category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading incidents...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No incidents match your filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Reporter</th>
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
                    <td>{inc.profiles?.full_name || 'Unknown'}</td>
                    <td>{inc.category}</td>
                    <td><SeverityBadge severity={inc.severity} /></td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td>{formatDate(inc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
