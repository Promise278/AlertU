import type { Incident } from '../types/incident'
import { DEFAULT_CAMPUS } from '../data/campus'

const incidents: Incident[] = [
  {
    id: 'demo-1',
    campusId: DEFAULT_CAMPUS.id,
    category: 'Security',
    status: 'Under review',
    title: 'Demo incident: unusual activity near a campus gate',
    location: 'North Gate',
    time: 'Recently reported',
    coordinates: [6.2500, 7.1140],
  },
  {
    id: 'demo-2',
    campusId: DEFAULT_CAMPUS.id,
    category: 'Facilities',
    status: 'Verified',
    title: 'Demo incident: damaged walkway lighting',
    location: 'Library walkway',
    time: 'Earlier today',
    coordinates: [6.2475, 7.1170],
  },
]

export function getMockIncidents(): Incident[] {
  return incidents
}