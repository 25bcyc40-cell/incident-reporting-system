import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ReportIncident from './pages/ReportIncident'
import MyIncidents from './pages/MyIncidents'
import IncidentDetails from './pages/IncidentDetails'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  const { loading, user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle role-based routing after OAuth redirect
  useEffect(() => {
    if (!loading && user && profile) {
      // After session is restored, route based on role
      const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
      const isAdminPage = location.pathname === '/admin'
      const isDashboardPage = location.pathname === '/dashboard'
      const isOtherPage = location.pathname.startsWith('/report-incident') || 
                         location.pathname.startsWith('/my-incidents') || 
                         location.pathname.startsWith('/incidents/') ||
                         location.pathname === '/'

      if (!isAuthPage) {
        // If admin and not already on admin page, redirect to admin
        if (profile.role === 'admin' && !isAdminPage && !isDashboardPage && !isOtherPage) {
          navigate('/admin', { replace: true })
        }
        // If user and on root or other non-specific page, go to dashboard
        else if (isOtherPage && location.pathname === '/') {
          navigate(profile.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
        }
      }
    }
  }, [loading, user, profile, navigate, location.pathname])

  if (loading) {
    return (
      <div className="loading-state" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report-incident" element={<ReportIncident />} />
          <Route path="/my-incidents" element={<MyIncidents />} />
          <Route path="/incidents/:id" element={<IncidentDetails />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
