import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function CampusMap({ reports }) {
  console.log("MAP REPORTS:", reports);
  const campusCenter = [6.2195, 6.9785];

  return (
    <section className="map-section">
      <div className="map-heading">
        <h2>Campus Incident Map</h2>
        <p>Explore reported incidents around your campus.</p>
      </div>

      <MapContainer
        center={campusCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="campus-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>
          {[...reports].reverse().map((report) => {
            if (!report.coordinates) return null;

            return (
              <Marker
                key={report.id}
                position={[
                  Number(report.coordinates[0]),
                  Number(report.coordinates[1]),
                ]}
              >
                <Popup>
                  <h3>{report.title}</h3>
                  <p>Location: {report.location}</p>
                  <p>Severity: {report.severity}</p>
                  <p>Status: {report.status}</p>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </section>
  );
}

export default CampusMap;
