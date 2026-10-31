import { useState } from "react";
import Sidebar from "../components/Sidebar";
import IncidentStats from "../components/IncidentStats";
import IncidentCard from "../components/IncidentCard";
import ReportForm from "../components/ReportForm";
import mockReports from "../data/mockReports";

function Dashboard() {
  const [reports, setReports] = useState(mockReports);
  const [activePage, setActivePage] = useState("Dashboard");

  function handleNewReport(newReport) {
    setReports((previousReports) => [newReport, ...previousReports]);
    setActivePage("Dashboard");
  }

  return (
    <div className="dashboard-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="dashboard-main">
        {activePage === "Report Incident" ? (
          <ReportForm
            onSubmit={handleNewReport}
            onCancel={() => setActivePage("Dashboard")}
          />
        ) : (
          <>
            <header className="dashboard-header">
              <div>
                <h1>Campus Overview</h1>
                <p>Stay informed about what's happening around your campus.</p>
              </div>
            </header>

            <IncidentStats reports={reports} />

            <section className="recent-incidents">
              <div className="section-heading">
                <div>
                  <h2>Recent Incidents</h2>
                  <p>Latest reports from your campus community.</p>
                </div>
              </div>

              <div className="incident-list">
                {reports.map((report) => (
                  <IncidentCard key={report.id} report={report} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
