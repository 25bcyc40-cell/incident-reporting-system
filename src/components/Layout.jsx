import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>🔒 SecureIncidents</h2>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px', letterSpacing: '0.3px' }}>
            INCIDENT MANAGEMENT
          </p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/my-incidents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📋</span>
            <span>My Incidents</span>
          </NavLink>
          <NavLink to="/report-incident" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🆕</span>
            <span>Report Incident</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">⚙️</span>
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" title={profile?.full_name}>{initials}</div>
            <div className="user-details">
              <div className="user-name">{profile?.full_name || 'User'}</div>
              <div className="user-role">{profile?.role === 'admin' ? 'Administrator' : 'User'}</div>
            </div>
          </div>
          <button className="btn-signout" onClick={signOut} title="Sign out">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
