function IncidentStats({ reports }) {
  const total = reports.length;

  const pending = reports.filter(
    (report) => report.status === "Pending",
  ).length;

  const verified = reports.filter(
    (report) => report.status === "Verified",
  ).length;

  const resolved = reports.filter(
    (report) => report.status === "Resolved",
  ).length;

  const stats = [
    { title: "Total Incidents", value: total, icon: "▤", color: "blue" },
    { title: "Pending", value: pending, icon: "◷", color: "orange" },
    { title: "Verified", value: verified, icon: "✓", color: "green" },
    { title: "Resolved", value: resolved, icon: "✔", color: "purple" },
  ];

  return (
    <section className="incident-stats">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.title}>
          <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
          <div className="stat-info">
            <p>{stat.title}</p>
            <h2>{stat.value}</h2>
          </div>
        </article>
      ))}
    </section>
  );
}

export default IncidentStats;
