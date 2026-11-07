import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/auth-context'
import {
  createIncidentReport,
  INCIDENT_CATEGORIES,
  INCIDENT_CATEGORY_LABELS,
} from '../services/incidents'
import type { IncidentCategory } from '../types/incident'
import LocationPicker from '../components/map/LocationPicker'
import { campusLocations } from '../data/campusLocations'

import './ReportIncident.css'

function ReportIncident() {
  const { user } = useAuth()

  const [category, setCategory] = useState<IncidentCategory | ''>('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [identity, setIdentity] = useState<
    'identified' | 'private' | ''
  >('')

  const [reference, setReference] = useState('')
  const [incidentId, setIncidentId] = useState('')

  const [coordinates, setCoordinates] = useState<[number, number]>(
    [6.24858, 7.11545]
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handlePresetLocationChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const selectedLocation = campusLocations.find(
      (item) => item.name === event.target.value
    )

    if (selectedLocation) {
      setLocation(selectedLocation.name)
      setCoordinates(selectedLocation.coordinates)
    }
  }

  function handleMapLocationSelect(
    selectedCoordinates: [number, number]
  ) {
    setCoordinates(selectedCoordinates)

    setLocation(
      `Map-selected location (${selectedCoordinates[0].toFixed(5)}, ${selectedCoordinates[1].toFixed(5)})`
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')

    if (!category) {
      setSubmitError('Select an incident category.')
      return
    }

    if (!identity) {
      setSubmitError('Choose how your identity should appear.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createIncidentReport({
        campusId: user?.campusId ?? undefined,
        category,
        description,
        locationName: location,
        latitude: coordinates[0],
        longitude: coordinates[1],
        isAnonymous: identity === 'private',
      })

      setReference(
        `ALU-${result.reportId.slice(0, 8).toUpperCase()}`
      )
      setIncidentId(result.incidentId)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Could not submit your report. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (reference) {
    return (
      <div className="report-page">
        <div className="report-success">
          <div className="report-success-icon">✓</div>

          <h1>Report received</h1>

          <p>
            Your report has been sent to campus authorities for review.
          </p>

          <div className="report-reference">
            <span>Reference number</span>
            <strong>{reference}</strong>
          </div>

          <p>
            Please keep this reference for your records.
            Reports require review before they can be verified.
          </p>

          <Link to="/dashboard" className="report-submit-button">
            Return to Campus Pulse
          </Link>

          {incidentId && (
            <Link
              to={`/incidents/${incidentId}`}
              className="report-success-link"
            >
              View incident
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="report-page">
      <div className="report-heading">
        <p className="pulse-eyebrow">CAMPUS SAFETY</p>
        <h1>Report an Incident</h1>
        <p>
          Help keep your campus safe by reporting an incident.
        </p>
      </div>

      <form className="report-form" onSubmit={handleSubmit}>
        {submitError && (
          <p className="report-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="report-field">
          <label htmlFor="incident-category">
            Incident category *
          </label>

          <select
            id="incident-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as IncidentCategory | '')
            }
            disabled={isSubmitting}
            required
          >
            <option value="">Select a category</option>
            {INCIDENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {INCIDENT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="report-field">
          <label htmlFor="incident-description">
            What happened? *
          </label>

          <textarea
            id="incident-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what happened..."
            rows={5}
            minLength={5}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="report-field">
          <label htmlFor="incident-location">
            Where did it happen? *
          </label>

          <select
            id="campus-location"
            value={campusLocations.some(
              (item) => item.name === location
            ) ? location : ''}
            onChange={handlePresetLocationChange}
            disabled={isSubmitting}
          >
            <option value="">Choose a campus location</option>

            {campusLocations.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            id="incident-location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Or enter the location manually"
            disabled={isSubmitting}
            required
          />

          <LocationPicker
            coordinates={coordinates}
            onLocationSelect={handleMapLocationSelect}
          />

          <small>
            Selected coordinates: {coordinates[0].toFixed(5)},{' '}
            {coordinates[1].toFixed(5)}
          </small>
        </div>

        <fieldset className="report-identity">
          <legend>How should your identity appear? *</legend>

          <label>
            <input
              type="radio"
              name="identity"
              value="identified"
              checked={identity === 'identified'}
              onChange={(event) =>
                setIdentity(event.target.value as 'identified')
              }
              disabled={isSubmitting}
              required
            />
            Share my identity
          </label>

          <label>
            <input
              type="radio"
              name="identity"
              value="private"
              checked={identity === 'private'}
              onChange={(event) =>
                setIdentity(event.target.value as 'private')
              }
              disabled={isSubmitting}
            />
            Keep my identity private
          </label>
        </fieldset>

        <button
          type="submit"
          className="report-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting report...' : 'Submit Report'}
        </button>

        <p className="report-form-note">
          Reports are subject to review before verification.
        </p>
      </form>
    </div>
  )
}

export default ReportIncident
