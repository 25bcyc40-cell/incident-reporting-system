/**
 * SkeletonLoader - Generic skeleton/placeholder for loading states
 * Ultra-fast animation to feel responsive
 * Usage: <SkeletonLoader width="100px" height="20px" />
 */
export default function SkeletonLoader({ width = '100%', height = '20px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, var(--color-bg-hover) 25%, var(--color-border) 50%, var(--color-bg-hover) 75%)',
        backgroundSize: '200% 100%',
        borderRadius: 'var(--radius-sm)',
        animation: 'skeleton-shimmer 1s infinite',
        ...style,
      }}
    />
  )
}
