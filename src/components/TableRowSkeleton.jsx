import SkeletonLoader from './SkeletonLoader'

/**
 * TableRowSkeleton - Skeleton loading state for table rows
 * Usage: <TableRowSkeleton columns={5} count={3} />
 */
export default function TableRowSkeleton({ columns = 5, count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx}>
              <SkeletonLoader width={colIdx === 0 ? '70%' : '60%'} height="16px" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
