import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '../lib/api'
import { fetchIncident } from '../services/incidents'
import type { IncidentDetail } from '../types/incident'

import './IncidentDetails.css'

interface LoadState {
  id: string | null
  incident: IncidentDetail | null
  error: string
  isLoading: boolean
}

function IncidentDetails() {
  const { id } = useParams()

  const [loadState, setLoadState] = useState<LoadState>(() => ({
    id: id ?? null,
    incident: null,
    error: id ? '' : 'Incident not found.',
    isLoading: Boolean(id),
  }))

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()
    let active = true

    fetchIncident(id, controller.signal)
      .then((record) => {
        if (active) {
          setLoadState({
            id,
            incident: record,
            error: '',
            isLoading: false,
          })
        }
      })
      .catch((loadError) => {
        if (!active || controller.signal.aborted) return

        const message =
          loadError instanceof ApiError && loadError.status === 404
            ? 'Incident not found.'
            : loadError instanceof Error
              ? loadError.message
              : 'Could not load this incident.'

        setLoadState({
          id,
          incident: null,
          error: message,
          isLoading: false,
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [id])

  const currentState =
    loadState.id === id
      ? loadState
      : {
          id: id ?? null,
          incident: null,
          error: id ? '' : 'Incident not found.',
          isLoading: Boolean(id),
        }

  const { incident, error, isLoading } = currentState

  if (isLoading) {
    return (
      <div className="incident-not-found">
        <h2>Loading incident</h2>
        <p>Fetching the latest details from AlertU.</p>
      </div>
    )
  }

  if (!incident || error) {
    return (
      <div className="incident-not-found">
        <h2>Incident not found</h2>
        <p>{error || 'This incident may no longer be available.'}</p>
        <Link to="/dashboard">Back to Campus Pulse</Link>
      </div>
    )
  }

  const statusClass = incident.status.replace(/_/g, '-')

  return (
    <div className="incident-details-page">
      <Link to="/dashboard" className="incident-back-link">
        ← Back to Campus Pulse
      </Link>

      <div className="incident-details-card">
        <div className="incident-details-top">
          <span className="incident-details-category">
            {incident.categoryLabel}
          </span>

          <span className={`incident-details-status ${statusClass}`}>
            {incident.statusLabel}
          </span>
        </div>

        <h1>{incident.title}</h1>

        {incident.description && (
          <p className="incident-details-summary">
            {incident.description}
          </p>
        )}

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
            <p>{incident.categoryLabel}</p>
          </div>

          <div>
            <span>Source reports</span>
            <p>{incident.reportCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentDetails
