import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Show loading only while checking auth (very brief)
  if (loading) {
    return (
      <div className="loading-state" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // No user = not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User authenticated, render protected content
  return <Outlet />
}
