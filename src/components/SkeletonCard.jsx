import SkeletonLoader from './SkeletonLoader'

/**
 * SkeletonCard - Skeleton loading state for a card with multiple fields
 * Usage: <SkeletonCard lines={3} />
 */
export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ marginBottom: i < lines - 1 ? '14px' : '0' }}>
          <SkeletonLoader width={Math.random() > 0.5 ? '60%' : '80%'} height="18px" />
        </div>
      ))}
    </div>
  )
}
