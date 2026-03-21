import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SeverityBadge, StatusBadge } from '../components/Badge'
import StatCard from '../components/StatCard'
import TableRowSkeleton from '../components/TableRowSkeleton'
import ErrorBanner from '../components/ErrorBanner'
import EmptyState from '../components/EmptyState'

const STATUSES = ['All', 'Open', 'Investigating', 'Resolved', 'Closed']
const SEVERITIES = ['All', 'Low', 'Medium', 'High', 'Critical']
const CATEGORIES = ['All', 'Security Breach', 'Data Leak', 'System Outage', 'Unauthorized Access', 'Malware', 'Phishing', 'Other']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ status: 'All', severity: 'All', category: 'All' })
  const [stats, setStats] = useState({ total: 0, open: 0, investigating: 0, resolved: 0, critical: 0 })

  // Fetch filtered incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('incidents')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })

        if (filters.status !== 'All') query = query.eq('status', filters.status)
        if (filters.severity !== 'All') query = query.eq('severity', filters.severity)
        if (filters.category !== 'All') query = query.eq('category', filters.category)

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        setIncidents(data || [])
      } catch (err) {
        console.error('[AdminDashboard] Error fetching incidents:', err)
        setError(err.message || 'Failed to load incidents')
        setIncidents([])
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
  }, [filters])

  // Fetch stats once on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error: fetchError } = await supabase.from('incidents').select('id, status, severity')

        if (fetchError) throw fetchError

        if (data) {
          setStats({
            total: data.length,
            open: data.filter(i => i.status === 'Open').length,
            investigating: data.filter(i => i.status === 'Investigating').length,
            resolved: data.filter(i => i.status === 'Resolved').length,
            critical: data.filter(i => i.severity === 'Critical').length,
          })
        }
      } catch (err) {
        console.error('[AdminDashboard] Error fetching stats:', err)
      }
    }
    fetchStats()
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage and review all incidents across the system.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon="📄" label="Total Incidents" value={stats.total} />
        <StatCard icon="🔵" label="Open" value={stats.open} />
        <StatCard icon="🔍" label="Investigating" value={stats.investigating} />
        <StatCard icon="✅" label="Resolved" value={stats.resolved} />
      </div>

      {/* Critical Incidents Alert */}
      {stats.critical > 0 && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          ⚠️ {stats.critical} critical incident{stats.critical > 1 ? 's' : ''} requiring immediate attention
        </div>
      )}

      {/* Incidents Table with Filters */}
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ marginBottom: '12px' }}>All Incidents</h2>
          <div className="filter-bar">
            <select
              id="admin-filter-status"
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
            <select
              id="admin-filter-severity"
              value={filters.severity}
              onChange={e => handleFilterChange('severity', e.target.value)}
            >
              {SEVERITIES.map(s => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Severities' : s}
                </option>
              ))}
            </select>
            <select
              id="admin-filter-category"
              value={filters.category}
              onChange={e => handleFilterChange('category', e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
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
                <TableRowSkeleton columns={6} count={5} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <ErrorBanner message={error} dismissible={false} />
        ) : incidents.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No incidents found"
            description="No incidents match your filter criteria. Try adjusting the filters."
          />
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
                {incidents.map(incident => (
                  <tr key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)}>
                    <td>{incident.title}</td>
                    <td>{incident.profiles?.full_name || 'Unknown'}</td>
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
        )}
      </div>
    </div>
  )
}
