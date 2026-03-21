import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  console.log('[ProtectedRoute] Auth state:', { loading, userExists: !!user })

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
    console.log('[ProtectedRoute] No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // User authenticated, render protected content
  // Layout will render immediately, pages manage their own data loading
  console.log('[ProtectedRoute] User authenticated, rendering protected content')
  return <Outlet />
}
