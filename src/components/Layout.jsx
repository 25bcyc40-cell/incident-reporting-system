import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>Secure</span>
          <h2>Incident Reports</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/my-incidents" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📋</span>
            My Incidents
          </NavLink>
          <NavLink to="/report-incident" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">🆕</span>
            Report Incident
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">⚙️</span>
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{profile?.full_name || 'User'}</div>
              <div className="user-role">{profile?.role || 'user'}</div>
            </div>
          </div>
          <button className="btn-signout" onClick={signOut}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
