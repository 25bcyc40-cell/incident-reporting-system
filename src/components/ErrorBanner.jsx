/**
 * ErrorBanner - Shows error messages with optional retry
 * Usage: <ErrorBanner message="Failed to load" onRetry={handleRetry} />
 */
export default function ErrorBanner({ message, onRetry, dismissible = true, onDismiss }) {
  return (
    <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{message}</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.8rem',
            }}
          >
            Retry
          </button>
        )}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: '1',
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
