
import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
} from 'react-leaflet'

import L from 'leaflet'
import {
  fetchIncidents,
  INCIDENT_CATEGORIES,
  INCIDENT_CATEGORY_LABELS,
} from '../../services/incidents'
import type {
  Incident,
  IncidentCategory,
} from '../../types/incident'

import './CampusMap.css'

function getCategoryIcon(category: IncidentCategory): string {
  const icons: Record<IncidentCategory, string> = {
    safety: '🛡️',
    harassment: '⚠️',
    theft: '🕵️',
    vandalism: '🔨',
    infrastructure: '🔧',
    medical: '🚑',
    fire: '🔥',
    other: '📍',
  }

  return icons[category] || '📍'
}

function getIncidentIcon(incident: Incident) {
  const statusClass = incident.status.replace(/_/g, '-')

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
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchIncidents({ signal: controller.signal })
      .then((records) => {
        if (active) setIncidents(records)
      })
      .catch((loadError) => {
        if (!active || controller.signal.aborted) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load map incidents.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const [activeCategory, setActiveCategory] = useState<
    IncidentCategory | 'all'
  >('all')

  const categories: Array<{
    label: string
    value: IncidentCategory | 'all'
  }> = [
    { label: 'All', value: 'all' },
    ...INCIDENT_CATEGORIES.map((category) => ({
      label: INCIDENT_CATEGORY_LABELS[category],
      value: category,
    })),
  ]

  const filteredIncidents =
    activeCategory === 'all'
      ? incidents
      : incidents.filter(
          (incident) => incident.category === activeCategory,
        )

  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null)

  return (
    <div className="campus-map">
      {isLoading && (
        <div className="map-status">Loading incidents...</div>
      )}

      {error && (
        <div className="map-status map-status-error">{error}</div>
      )}

      <div className="map-category-filters">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            className={
              activeCategory === category.value ? 'active' : ''
            }
            onClick={() => setActiveCategory(category.value)}
          >
            {category.label}
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
            {' '}{selectedIncident.categoryLabel}
          </span>

          <h3>{selectedIncident.title}</h3>

          <p>{selectedIncident.location}</p>

          <p>{selectedIncident.time}</p>

          <span
            className={`popup-status ${selectedIncident.status.replace(
              /_/g,
              '-',
            )}`}
          >
            {selectedIncident.statusLabel}
          </span>
        </div>
      )}
    </div>
  )
}

export default CampusMap
