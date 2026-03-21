import SkeletonLoader from './SkeletonLoader'

/**
 * SkeletonCard - Skeleton loading state for a card with multiple fields
 * Renders optimized skeleton lines for faster perception of loading
 */
export default function SkeletonCard({ lines = 3 }) {
  const heights = [16, 14, 16] // Smaller heights for faster loading perception
  
  return (
    <div className="card">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ marginBottom: i < lines - 1 ? '12px' : '0', display: 'flex', gap: '8px' }}>
          {/* Multiple small skeletons per line for table-like appearance */}
          <SkeletonLoader width="40%" height={`${heights[i % 3]}px`} />
          <SkeletonLoader width="30%" height={`${heights[i % 3]}px`} />
          <SkeletonLoader width="20%" height={`${heights[i % 3]}px`} />
        </div>
      ))}
    </div>
  )
}
