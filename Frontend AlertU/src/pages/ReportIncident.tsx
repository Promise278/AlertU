
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { createIncident } from '../services/incidentStore'
import LocationPicker from '../components/map/LocationPicker'
import { campusLocations } from '../data/campusLocations'
import { DEFAULT_CAMPUS } from '../data/campus'

import './ReportIncident.css'

function ReportIncident() {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [identity, setIdentity] = useState('')
  const [reference, setReference] = useState('')

  const [coordinates, setCoordinates] = useState<[number, number]>(
    [6.24858, 7.11545]
  )

  const [photos, setPhotos] = useState<File[]>([])
  const [photoError, setPhotoError] = useState('')

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(event.target.files || [])

    if (photos.length + selectedFiles.length > 3) {
      setPhotoError('You can upload a maximum of 3 photos.')
      event.target.value = ''
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setPhotoError('Only JPG, PNG and WebP images are allowed.')
        event.target.value = ''
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Each photo must be 5MB or smaller.')
        event.target.value = ''
        return
      }
    }

    setPhotos((currentPhotos) => [
      ...currentPhotos,
      ...selectedFiles,
    ])

    setPhotoError('')
    event.target.value = ''
  }

  function removePhoto(index: number) {
    setPhotos((currentPhotos) =>
      currentPhotos.filter((_, photoIndex) => photoIndex !== index)
    )

    setPhotoError('')
  }

  function handlePresetLocationChange(
    event: React.ChangeEvent<HTMLSelectElement>
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const incidentReference = `ALU-${Date.now().toString().slice(-6)}`

    createIncident({
      reference: incidentReference,
      category,
      status: 'Under review',
      title: `${category} incident`,
      description,
      location,
      coordinates,
      time: 'Just now',
      createdAt: new Date().toISOString(),
      identity: identity as 'identified' | 'private',
      campusId: DEFAULT_CAMPUS.id,
    })

    setReference(incidentReference)
  }

  if (reference) {
    return (
      <div className="report-page">
        <div className="report-success">
          <div className="report-success-icon">✓</div>

          <h1>Report received</h1>

          <p>
            Your demonstration report has been recorded in this session.
          </p>

          <div className="report-reference">
            <span>Reference number</span>
            <strong>{reference}</strong>
          </div>

          <p>
            Please keep this reference for your records.
            Reports require review before they can be verified.
          </p>

          <p className="report-demo-notice">
            Demo mode: this report has not been sent to campus authorities.
          </p>

          <Link to="/" className="report-submit-button">
            Return to Campus Pulse
          </Link>
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
        <div className="report-field">
          <label htmlFor="incident-category">
            Incident category *
          </label>

          <select
            id="incident-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="">Select a category</option>
            <option value="Security">Security</option>
            <option value="Facilities">Facilities</option>
            <option value="Harassment">Harassment</option>
            <option value="Other">Other</option>
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

        <div className="report-field">
          <label htmlFor="incident-photos">
            Evidence photos (optional)
          </label>

          <input
            id="incident-photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoChange}
          />

          <small>
            Maximum 3 photos. Each photo must be 5MB or smaller.
          </small>

          {photoError && (
            <p className="report-error">{photoError}</p>
          )}

          {photos.length > 0 && (
            <div className="report-photo-list">
              {photos.map((photo, index) => (
                <div
                  className="report-photo-item"
                  key={`${photo.name}-${index}`}
                >
                  <span>{photo.name}</span>

                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <fieldset className="report-identity">
          <legend>How should your identity appear? *</legend>

          <label>
            <input
              type="radio"
              name="identity"
              value="identified"
              checked={identity === 'identified'}
              onChange={(event) => setIdentity(event.target.value)}
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
              onChange={(event) => setIdentity(event.target.value)}
            />
            Keep my identity private
          </label>
        </fieldset>

        <button type="submit" className="report-submit-button">
          Submit Report
        </button>

        <p className="report-form-note">
          Reports are subject to review before verification.
        </p>
      </form>
    </div>
  )
}

export default ReportIncident
