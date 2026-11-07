
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CampusPulse.css'
import { DEFAULT_CAMPUS } from '../data/campus'
import {
  getIncidents,
  subscribeToIncidents,
} from '../services/incidentStore'
import type { Incident } from '../types/incident'
import {
  getSavedIncidentIds,
  toggleSavedIncident,
} from '../services/savedIncidents'

const statusFilters = [
  'All activity',
  'Under review',
  'Verified',
  'Resolved',
]

const categoryFilters = [
  'All categories',
  'Security',
  'Facilities',
  'Harassment',
  'Other',
]

function CampusPulse() {
  const [incidents, setIncidents] = useState<Incident[]>(
  getIncidents
)

useEffect(() => {
  const unsubscribe = subscribeToIncidents(() => {
    setIncidents(getIncidents())
  })

  return unsubscribe
}, [])

  const [activeFilter, setActiveFilter] = useState('All activity')
  const [activeCategory, setActiveCategory] = useState('All categories')
  const [searchQuery, setSearchQuery] = useState('')

  const [savedIds, setSavedIds] = useState<string[]>(
    getSavedIncidentIds
  )

  function handleSave(id: string) {
    const updatedIds = toggleSavedIncident(id)
    setSavedIds(updatedIds)
  }

  const filteredIncidents = incidents.filter((incident) => {
    const belongsToCampus =
      incident.campusId === DEFAULT_CAMPUS.id
    const matchesStatus =
      activeFilter === 'All activity' ||
      incident.status === activeFilter

    const matchesCategory =
      activeCategory === 'All categories' ||
      incident.category.toLowerCase() === activeCategory.toLowerCase()

    const search = searchQuery.trim().toLowerCase()

    const matchesSearch =
      incident.title.toLowerCase().includes(search) ||
      incident.location.toLowerCase().includes(search)

    return (
  belongsToCampus &&
  matchesStatus &&
  matchesCategory &&
  matchesSearch
)
  })

  function clearFilters() {
    setActiveFilter('All activity')
    setActiveCategory('All categories')
    setSearchQuery('')
  }

  return (
    <div className="campus-pulse">

      <section className="pulse-heading">
        <div>
          <p className="pulse-eyebrow">CAMPUS SAFETY</p>
          <h1>Campus Pulse</h1>
          <p className="pulse-intro">
            Stay informed about safety activity around your campus.
          </p>
        </div>

        <Link className="pulse-report-button" to="/report">
          + Report Incident
        </Link>
      </section>

      <section className="pulse-controls">

        <label className="pulse-search">
          <span className="sr-only">Search incidents</span>
          <input
            type="search"
            placeholder="Search incidents or locations..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="pulse-filter-group">
          <p className="pulse-filter-label">Status</p>

          <div className="pulse-filters">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`pulse-filter ${
                  activeFilter === filter ? 'active' : ''
                }`}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="pulse-filter-group">
          <p className="pulse-filter-label">Category</p>

          <div className="pulse-filters">
            {categoryFilters.map((category) => (
              <button
                key={category}
                type="button"
                className={`pulse-filter ${
                  activeCategory === category ? 'active' : ''
                }`}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

      </section>

      <section className="pulse-feed">

        <div className="pulse-feed-heading">
          <div>
            <h2>Campus activity</h2>
            <p>
              {filteredIncidents.length} incident
              {filteredIncidents.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <span className="pulse-demo-label">DEMO DATA</span>
        </div>

        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => (
            <div className="pulse-incident-card" key={incident.id}>

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
                aria-pressed={savedIds.includes(incident.id)}
                onClick={() => handleSave(incident.id)}
              >
                {savedIds.includes(incident.id) ? '★ Saved' : '☆ Save'}
              </button>

            </div>
          ))
        ) : (
          <div className="pulse-empty-state">
            <h3>No matching incidents</h3>
            <p>
              Try changing your search or selecting different filters.
            </p>

            <button
              type="button"
              className="pulse-clear-button"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          </div>
        )}

      </section>

    </div>
  )
}

export default CampusPulse
