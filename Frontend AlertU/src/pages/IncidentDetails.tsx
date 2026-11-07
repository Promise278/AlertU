
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  getIncidents,
  subscribeToIncidents,
} from '../services/incidentStore'

import type { Incident } from '../types/incident'

import './IncidentDetails.css'

function IncidentDetails() {
  const { id } = useParams()

  const [incident, setIncident] = useState<Incident | undefined>(
    () => getIncidents().find((item) => item.id === id)
  )

  useEffect(() => {
    const updateIncident = () => {
      const updatedIncident = getIncidents().find(
        (item) => item.id === id
      )

      setIncident(updatedIncident)
    }

    const unsubscribe = subscribeToIncidents(updateIncident)

    return unsubscribe
  }, [id])

  if (!incident) {
    return (
      <div className="incident-not-found">
        <h2>Incident not found</h2>
        <p>This incident may no longer be available.</p>
        <Link to="/">Back to Campus Pulse</Link>
      </div>
    )
  }

  const statusClass = incident.status
    .toLowerCase()
    .replace(' ', '-')

  return (
    <div className="incident-details-page">
      <Link to="/" className="incident-back-link">
        ← Back to Campus Pulse
      </Link>

      <div className="incident-details-card">
        <div className="incident-details-top">
          <span className="incident-details-category">
            {incident.category}
          </span>

          <span className={`incident-details-status ${statusClass}`}>
            {incident.status}
          </span>
        </div>

        <h1>{incident.title}</h1>

        <div className="incident-details-information">
          <div>
            <span>Location</span>
            <p>{incident.location}</p>
          </div>

          <div>
            <span>Reported</span>
            <p>{incident.time}</p>
          </div>

          <div>
            <span>Incident category</span>
            <p>{incident.category}</p>
          </div>
        </div>

        <div className="incident-demo-notice">
          This is demonstration incident data for AlertU.
        </div>
      </div>
    </div>
  )
}

export default IncidentDetails
