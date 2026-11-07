
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getIncidents,
  subscribeToIncidents,
} from '../services/incidentStore'

import {
  getSavedIncidentIds,
  toggleSavedIncident,
} from '../services/savedIncidents'

import type { Incident } from '../types/incident'

import './CampusPulse.css'

function SavedIncidents() {
  const [savedIds, setSavedIds] = useState<string[]>(
    getSavedIncidentIds
  )

  const [incidents, setIncidents] = useState<Incident[]>(
    getIncidents
  )

  useEffect(() => {
    const unsubscribe = subscribeToIncidents(() => {
      setIncidents(getIncidents())
    })

    return unsubscribe
  }, [])

  const savedIncidents = incidents.filter(
    (incident) => savedIds.includes(incident.id)
  )

  function handleRemove(id: string) {
    const updatedIds = toggleSavedIncident(id)
    setSavedIds(updatedIds)
  }

  return (
    <div className="campus-pulse">

      <section className="pulse-heading">
        <div>
          <p className="pulse-eyebrow">YOUR ACTIVITY</p>
          <h1>Saved Incidents</h1>
          <p className="pulse-intro">
            Keep track of incidents that matter to you.
          </p>
        </div>
      </section>

      <section className="pulse-feed">

        <div className="pulse-feed-heading">
          <div>
            <h2>Your saved incidents</h2>
            <p>
              {savedIncidents.length} saved incident
              {savedIncidents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {savedIncidents.length > 0 ? (
          savedIncidents.map((incident) => (
            <div
              className="pulse-incident-card"
              key={incident.id}
            >

              <div className="pulse-incident-topline">
                <span className="pulse-category">
                  {incident.category}
                </span>

                <span
                  className={`pulse-status ${
                    incident.status === 'Verified'
                      ? 'verified'
                      : incident.status === 'Resolved'
                        ? 'resolved'
                        : 'under-review'
                  }`}
                >
                  {incident.status}
                </span>
              </div>

              <Link
                to={`/incidents/${incident.id}`}
                className="pulse-incident-link"
              >
                <h3>{incident.title}</h3>

                <div className="pulse-incident-meta">
                  <span>{incident.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{incident.time}</span>
                </div>
              </Link>

              <button
                type="button"
                className="pulse-save-button"
                onClick={() => handleRemove(incident.id)}
              >
                Remove saved incident
              </button>

            </div>
          ))
        ) : (
          <div className="pulse-empty-state">
            <h3>No saved incidents yet</h3>

            <p>
              Incidents you save from Campus Pulse will appear here.
            </p>

            <Link
              to="/"
              className="pulse-report-button"
            >
              Explore Campus Pulse
            </Link>
          </div>
        )}

      </section>

    </div>
  )
}

export default SavedIncidents
