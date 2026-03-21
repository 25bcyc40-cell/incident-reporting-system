/**
 * SkeletonLoader - Generic skeleton/placeholder for loading states
 * Usage: <SkeletonLoader width="100px" height="20px" />
 */
export default function SkeletonLoader({ width = '100%', height = '20px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        background: 'var(--color-bg-hover)',
        borderRadius: 'var(--radius-sm)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}
