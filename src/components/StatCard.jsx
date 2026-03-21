import SkeletonLoader from './SkeletonLoader'

/**
 * StatCard - Displays a statistic with icon and label
 * Usage: <StatCard icon="📄" label="Total Incidents" value={42} loading={false} />
 */
export default function StatCard({ icon = '📊', label, value, loading = false }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {loading ? <SkeletonLoader width="80px" height="28px" /> : value}
      </div>
    </div>
  )
}
