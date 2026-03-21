import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
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
  const { loading } = useAuth()

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
