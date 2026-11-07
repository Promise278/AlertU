import type { Incident } from '../types/incident'
import { getMockIncidents } from './mockIncidents'
import { DEFAULT_CAMPUS } from '../data/campus'

const STORAGE_KEY = 'alertu-incidents'
const UPDATE_EVENT = 'alertu-incidents-updated'

// Read all incidents
export function getIncidents(): Incident[] {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (saved) {
    try {
const parsedIncidents = JSON.parse(saved) as Partial<Incident>[]

const updatedIncidents = parsedIncidents.map((incident) => ({
  ...incident,
  campusId: incident.campusId ?? DEFAULT_CAMPUS.id,
})) as Incident[]

localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify(updatedIncidents)
)

return updatedIncidents    } catch {
      console.error('Could not read saved incidents.')
    }
  }

  // Load demo incidents the first time
  const initialIncidents = getMockIncidents()

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(initialIncidents)
  )

  return initialIncidents
}

// Save the complete incident collection
function saveIncidents(incidents: Incident[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(incidents)
  )

  window.dispatchEvent(new Event(UPDATE_EVENT))
}

// Create a new incident
export function createIncident(
  incident: Omit<Incident, 'id'>
): Incident {
  const newIncident: Incident = {
    ...incident,
    id: crypto.randomUUID(),
  }

  const incidents = getIncidents()

  saveIncidents([newIncident, ...incidents])

  return newIncident
}

// Update an incident's moderation status
export function updateIncidentStatus(
  id: string,
  status: Incident['status']
): void {
  const incidents = getIncidents()

  const updatedIncidents = incidents.map((incident) =>
    incident.id === id
      ? { ...incident, status }
      : incident
  )

  saveIncidents(updatedIncidents)
}

// Listen for incident changes
export function subscribeToIncidents(
  callback: () => void
): () => void {
  window.addEventListener(UPDATE_EVENT, callback)

  return () => {
    window.removeEventListener(UPDATE_EVENT, callback)
  }
}

