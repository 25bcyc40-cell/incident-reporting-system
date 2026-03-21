/**
 * EmptyState - Shows friendly message when no data exists
 * Usage: <EmptyState icon="📋" title="No incidents" description="You haven't..." action={{ label: "Create", onClick: () => {} }} />
 */
export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state" style={{ padding: '40px 20px' }}>
      <div className="empty-icon">{icon}</div>
      <h3 style={{ margin: '12px 0 8px', fontSize: '1.1rem', fontWeight: '600' }}>{title}</h3>
      <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}
