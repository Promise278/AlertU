import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const mobileItems = [
  { label: 'Home', path: '/dashboard', icon: '⌂' },
  { label: 'Posts', path: '/posts', icon: '▤' },
  { label: 'Map', path: '/map', icon: '◎' },
  { label: 'Report', path: '/report', icon: '+' },
  { label: 'Saved', path: '/saved', icon: '☆' },
  { label: 'Alerts', path: '/notifications', icon: '♧' },
]

function BottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/dashboard'}
          className={({ isActive }) =>
            `mobile-nav-link ${isActive ? 'active' : ''} ${
              item.path === '/report' ? 'mobile-report-link' : ''
            }`
          }
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            {item.icon}
          </span>

          <span className="mobile-nav-label">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
