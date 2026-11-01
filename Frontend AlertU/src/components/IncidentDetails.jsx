function IncidentDetails({ report, onBack }) {
  return (
    <section className="incident-details-page">
      <button className="back-btn" onClick={onBack}>
        ← Back to incidents
      </button>

      <div className="incident-details-card">
        <div className="details-header">
          <div>
            <p>{report.category}</p>
            <h1>{report.title}</h1>
          </div>

          <span className={`status-badge ${report.status.toLowerCase()}`}>
            {report.status}
          </span>
        </div>

        <div className="details-info">
          <div>
            <span>📍 Location</span>
            <p>{report.location}</p>
          </div>

          <div>
            <span>⚠️ Severity</span>
            <p>{report.severity}</p>
          </div>

          <div>
            <span>🕒 Reported</span>
            <p>{report.time}</p>
          </div>
        </div>

        <div className="details-description">
          <h3>Incident Description</h3>
          <p>
            {report.description || "No additional description was provided."}
          </p>
        </div>

        <div className="details-status">
          <h3>Verification Status</h3>
          <p>
            This report is currently <strong>{report.status}</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}

export default IncidentDetails;
