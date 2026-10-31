function IncidentCard({ report }) {
  return (
    <article className="incident-card">
      <div className="incident-card-top">
        <div>
          <h3>{report.title}</h3>
          <p className="incident-category">{report.category}</p>
        </div>

        <span className={`status-badge ${report.status.toLowerCase()}`}>
          {report.status}
        </span>
      </div>

      <div className="incident-details">
        <span>📍 {report.location}</span>
        <span>🕒 {report.time}</span>
      </div>

      <div className="incident-card-bottom">
        <span className={`severity ${report.severity.toLowerCase()}`}>
          {report.severity} Severity
        </span>
      </div>
    </article>
  );
}

export default IncidentCard;
