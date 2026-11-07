
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CampusPulse.css'
import {
  fetchIncidents,
  INCIDENT_CATEGORIES,
  INCIDENT_CATEGORY_LABELS,
} from '../services/incidents'
import type {
  Incident,
  IncidentCategory,
  IncidentStatus,
} from '../types/incident'
import {
  getSavedIncidentIds,
  toggleSavedIncident,
} from '../services/savedIncidents'

const statusFilters: Array<{
  label: string
  value: IncidentStatus | 'all'
}> = [
  { label: 'All activity', value: 'all' },
  { label: 'Reported', value: 'reported' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Resolved', value: 'resolved' },
]

const categoryFilters: Array<{
  label: string
  value: IncidentCategory | 'all'
}> = [
  { label: 'All categories', value: 'all' },
  ...INCIDENT_CATEGORIES.map((category) => ({
    label: INCIDENT_CATEGORY_LABELS[category],
    value: category,
  })),
]

function CampusPulse() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

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
            : 'Could not load campus activity.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadToken])

  const [activeFilter, setActiveFilter] = useState<
    IncidentStatus | 'all'
  >('all')
  const [activeCategory, setActiveCategory] = useState<
    IncidentCategory | 'all'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [savedIds, setSavedIds] = useState<string[]>(
    getSavedIncidentIds
  )

  function handleSave(id: string) {
    const updatedIds = toggleSavedIncident(id)
    setSavedIds(updatedIds)
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesStatus =
      activeFilter === 'all' || incident.status === activeFilter

    const matchesCategory =
      activeCategory === 'all' ||
      incident.category === activeCategory

    const search = searchQuery.trim().toLowerCase()

    const matchesSearch =
      incident.title.toLowerCase().includes(search) ||
      incident.location.toLowerCase().includes(search) ||
      (incident.description ?? '').toLowerCase().includes(search)

    return matchesStatus && matchesCategory && matchesSearch
  })

  function clearFilters() {
    setActiveFilter('all')
    setActiveCategory('all')
    setSearchQuery('')
  }

  function reloadIncidents() {
    setIsLoading(true)
    setError('')
    setReloadToken((token) => token + 1)
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
                key={filter.value}
                type="button"
                className={`pulse-filter ${
                  activeFilter === filter.value ? 'active' : ''
                }`}
                aria-pressed={activeFilter === filter.value}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pulse-filter-group">
          <p className="pulse-filter-label">Category</p>

          <div className="pulse-filters">
            {categoryFilters.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`pulse-filter ${
                  activeCategory === category.value ? 'active' : ''
                }`}
                aria-pressed={activeCategory === category.value}
                onClick={() => setActiveCategory(category.value)}
              >
                {category.label}
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
        </div>

        {isLoading ? (
          <div className="pulse-empty-state">
            <h3>Loading campus activity</h3>
            <p>Fetching the latest incidents from AlertU.</p>
          </div>
        ) : error ? (
          <div className="pulse-empty-state">
            <h3>Could not load campus activity</h3>
            <p>{error}</p>

            <button
              type="button"
              className="pulse-clear-button"
              onClick={reloadIncidents}
            >
              Try again
            </button>
          </div>
        ) : filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => (
            <div className="pulse-incident-card" key={incident.id}>

              <div className="pulse-incident-topline">
                <span className="pulse-category">
                  {incident.categoryLabel}
                </span>

                <span
                  className={`pulse-status ${incident.status.replace(
                    /_/g,
                    '-',
                  )}`}
                >
                  {incident.statusLabel}
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
