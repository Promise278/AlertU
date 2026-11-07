
import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
} from 'react-leaflet'

import L from 'leaflet'
import { DEFAULT_CAMPUS } from '../../data/campus'
import {
  getIncidents,
  subscribeToIncidents,
} from '../../services/incidentStore'
import type { Incident } from '../../types/incident'

import './CampusMap.css'

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Security: '🛡️',
    Facilities: '🔧',
    Harassment: '⚠️',
    Other: '📍',
  }

  return icons[category] || '📍'
}

function getIncidentIcon(incident: Incident) {
  const statusClass = incident.status
    .toLowerCase()
    .replace(' ', '-')

  return L.divIcon({
    className: 'incident-marker-wrapper',
    html: `
      <div class="incident-marker">
        <span class="incident-marker-icon">
          ${getCategoryIcon(incident.category)}
        </span>
        <span class="incident-marker-status ${statusClass}"></span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

function CampusMap() {
const [incidents, setIncidents] = useState<Incident[]>(
  getIncidents
)

useEffect(() => {
  const unsubscribe = subscribeToIncidents(() => {
    setIncidents(getIncidents())
  })

  return unsubscribe
}, [])

const [activeCategory, setActiveCategory] = useState('All')

const categories = [
  'All',
  'Security',
  'Facilities',
  'Harassment',
  'Other',
]

const campusIncidents = incidents.filter(
  (incident) => incident.campusId === DEFAULT_CAMPUS.id
)

const filteredIncidents = activeCategory === 'All'
  ? campusIncidents
  : campusIncidents.filter(
      (incident) => incident.category === activeCategory
    )

  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null)

  return (
    <div className="campus-map">
      
      <div className="map-category-filters">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              activeCategory === category ? 'active' : ''
            }
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>


      <MapContainer
        center={[6.24858, 7.11545]}
        zoom={15}
        scrollWheelZoom={false}
        className="campus-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={incident.coordinates}
            icon={getIncidentIcon(incident)}
            eventHandlers={{
              click: () => setSelectedIncident(incident),
            }}
          />
        ))}
      </MapContainer>

      
      <div className="map-legend">
        <h4>Incident status</h4>

        <div className="legend-item">
          <span className="legend-dot under-review"></span>
          Under review
        </div>

        <div className="legend-item">
          <span className="legend-dot verified"></span>
          Verified
        </div>

        <div className="legend-item">
          <span className="legend-dot resolved"></span>
          Resolved
        </div>
      </div>



      {selectedIncident && (
        <div className="incident-detail-panel">
          <button
            className="incident-panel-close"
            onClick={() => setSelectedIncident(null)}
            aria-label="Close incident details"
          >
            ×
          </button>

          <span className="incident-panel-category">
            {getCategoryIcon(selectedIncident.category)}
            {' '}{selectedIncident.category}
          </span>

          <h3>{selectedIncident.title}</h3>

          <p>{selectedIncident.location}</p>

          <p>{selectedIncident.time}</p>

          <span className={`popup-status ${
            selectedIncident.status.toLowerCase().replace(' ', '-')
          }`}>
            {selectedIncident.status}
          </span>
        </div>
      )}
    </div>
  )
}

export default CampusMap
