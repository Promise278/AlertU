function IncidentCard({ report, onClick }) {
  return (
    <article
      className="incident-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
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
