import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const navigationItems = [
  { label: 'Campus Pulse', path: '/dashboard', icon: '⌂' },
  { label: 'Campus Map', path: '/map', icon: '◎' },
  { label: 'Report Incident', path: '/report', icon: '+' },
  { label: 'Saved Incidents', path: '/saved', icon: '☆' },
  { label: 'Notifications', path: '/notifications', icon: '♧' },
  { label: 'Profile', path: '/profile', icon: '○' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
]

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-heading">
        STUDENT MENU
      </div>

      <nav className="sidebar-navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${
                item.path === '/report' ? 'report-link' : ''
              }`
            }
          >
            <span className="sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar