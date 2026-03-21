export function SeverityBadge({ severity }) {
  const s = (severity || '').toLowerCase()
  const classMap = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    critical: 'badge-critical',
  }
  return <span className={`badge ${classMap[s] || ''}`}>{severity}</span>
}

export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const classMap = {
    open: 'badge-open',
    investigating: 'badge-investigating',
    resolved: 'badge-resolved',
    closed: 'badge-closed',
  }
  return <span className={`badge ${classMap[s] || ''}`}>{status}</span>
}
