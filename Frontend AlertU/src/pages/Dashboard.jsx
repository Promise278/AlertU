import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import IncidentStats from "../components/IncidentStats";
import IncidentCard from "../components/IncidentCard";
import ReportForm from "../components/ReportForm";
import mockReports from "../data/mockReports";
import CampusMap from "../components/CampusMap";
import MyReports from "../components/MyReports";
import IncidentDetails from "../components/IncidentDetails";

function Dashboard() {
  const [reports, setReports] = useState(mockReports);
  const [myReports, setMyReports] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");

  function handleNewReport(newReport) {
    setReports((previousReports) => [newReport, ...previousReports]);

    setMyReports((previousReports) => [newReport, ...previousReports]);

    setActivePage("Dashboard");
  }
  console.log("ALL REPORTS:", reports);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || report.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "All" || report.status === selectedStatus;

    const matchesSeverity =
      selectedSeverity === "All" || report.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
  });

  useEffect(() => {
    console.log("UPDATED REPORTS:", reports);
  }, [reports]);

  return (
    <div className="dashboard-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="dashboard-main">
        {selectedReport ? (
          <IncidentDetails
            report={selectedReport}
            onBack={() => setSelectedReport(null)}
          />
        ) : (
          <>
            {activePage === "Report Incident" ? (
              <ReportForm
                onSubmit={handleNewReport}
                onCancel={() => setActivePage("Dashboard")}
              />
            ) : activePage === "Map" ? (
              <CampusMap reports={reports} />
            ) : activePage === "My Reports" ? (
              <MyReports
                reports={myReports}
                onSelectReport={setSelectedReport}
              />
            ) : (
              <>
                <header className="dashboard-header">
                  <div>
                    <h1>Campus Overview</h1>
                    <p>
                      Stay informed about what's happening around your campus.
                    </p>
                  </div>
                </header>

                <IncidentStats reports={reports} />

                <section className="recent-incidents">
                  <div className="section-heading">
                    <div>
                      <h2>Recent Incidents</h2>
                      <p>Latest reports from your campus community.</p>
                    </div>

                    <input
                      type="text"
                      placeholder="Search incidents..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="incident-search"
                    />

                    <select
                      value={selectedCategory}
                      onChange={(event) =>
                        setSelectedCategory(event.target.value)
                      }
                      className="incident-filter"
                    >
                      <option value="All">All Categories</option>
                      <option value="Road Hazard">Road Hazard</option>
                      <option value="Flooding">Flooding</option>
                      <option value="Obstruction">Obstruction</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(event) =>
                        setSelectedStatus(event.target.value)
                      }
                      className="incident-filter"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    <select
                      value={selectedSeverity}
                      onChange={(event) =>
                        setSelectedSeverity(event.target.value)
                      }
                      className="incident-filter"
                    >
                      <option value="All">All Severities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="incident-list">
                    {filteredReports.length > 0 ? (
                      filteredReports.map((report) => (
                        <IncidentCard
                          key={report.id}
                          report={report}
                          onClick={() => setSelectedReport(report)}
                        />
                      ))
                    ) : (
                      <p>No incidents found.</p>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
