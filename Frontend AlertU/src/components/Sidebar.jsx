import { useState } from "react";

function Sidebar({ activePage, setActivePage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "Report Incident", icon: "＋" },
    { name: "Map", icon: "⌖" },
    { name: "My Reports", icon: "▤" },
    { name: "Settings", icon: "⚙" },
  ];

  function handleNavigation(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  return (
    <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
      <div className="sidebar-logo">
        <div className="logo-content">
          <span>🛡️</span>
          <h2>CampusPulse</h2>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavigation(item.name)}
            className={`nav-link ${activePage === item.name ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>✓</span>
        <p>Building a safer campus together.</p>
      </div>
    </aside>
  );
}

export default Sidebar;
