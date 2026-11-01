import IncidentCard from "./IncidentCard";

function MyReports({ reports, onSelectReport }) {
  const pendingReports = reports.filter(
    (report) => report.status === "Pending",
  );

  const verifiedReports = reports.filter(
    (report) => report.status === "Verified",
  );

  const resolvedReports = reports.filter(
    (report) => report.status === "Resolved",
  );

  const summaries = [
    { title: "Total Reports", value: reports.length, icon: "▤", color: "blue" },
    {
      title: "Pending",
      value: pendingReports.length,
      icon: "◷",
      color: "orange",
    },
    {
      title: "Verified",
      value: verifiedReports.length,
      icon: "✓",
      color: "green",
    },
    {
      title: "Resolved",
      value: resolvedReports.length,
      icon: "✔",
      color: "purple",
    },
  ];

  return (
    <section className="my-reports">
      {" "}
      <header className="my-reports-heading">
        {" "}
        <div>
          {" "}
          <span className="page-label">YOUR ACTIVITY</span> <h1>My Reports</h1>{" "}
          <p>Keep track of the incidents you've reported on campus.</p>{" "}
        </div>
        ```
        <div className="reports-count">
          {reports.length} {reports.length === 1 ? "Report" : "Reports"}
        </div>
      </header>
      <div className="my-reports-summary">
        {summaries.map((item) => (
          <article className="report-summary-card" key={item.title}>
            <div className={`report-summary-icon ${item.color}`}>
              {item.icon}
            </div>

            <div>
              <p>{item.title}</p>
              <h3>{item.value}</h3>
            </div>
          </article>
        ))}
      </div>
      <div className="my-reports-list">
        <div className="my-reports-list-heading">
          <div>
            <h2>Your Submitted Reports</h2>
            <p>Review and track the status of your reports.</p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="empty-reports">
            <div className="empty-reports-icon">▤</div>
            <h3>No reports yet</h3>
            <p>
              You haven't submitted any incidents. When you do, they'll appear
              here so you can track their progress.
            </p>
          </div>
        ) : (
          <div className="incident-list">
            {reports.map((report) => (
              <IncidentCard
                key={report.id}
                report={report}
                onClick={() => onSelectReport(report)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default MyReports;
