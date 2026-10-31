function Sidebar({ activePage, setActivePage }) {
  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "Report Incident", icon: "＋" },
    { name: "Map", icon: "⌖" },
    { name: "My Reports", icon: "▤" },
    { name: "Settings", icon: "⚙" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>🛡️</span>
        <h2>CampusPulse</h2>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => setActivePage(item.name)}
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
