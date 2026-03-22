import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  // Wait for auth to complete
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. Admin access is required.</p>
      </div>
    )
  }

  return children
}
