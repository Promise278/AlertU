export type IncidentCategory =
  | 'safety'
  | 'harassment'
  | 'theft'
  | 'vandalism'
  | 'infrastructure'
  | 'medical'
  | 'fire'
  | 'other'

export type IncidentStatus =
  | 'reported'
  | 'candidate'
  | 'corroborated'
  | 'under_review'
  | 'verified'
  | 'disputed'
  | 'rejected'
  | 'resolved'
  | 'expired'
  | 'reopened'

export interface Incident {
  id: string
  campusId: string

  category: IncidentCategory
  categoryLabel: string
  status: IncidentStatus
  statusLabel: string

  title: string
  description: string | null

  location: string
  coordinates: [number, number]
  time: string

  firstSeenAt: string | null
  lastSeenAt: string | null
  expiresAt: string | null
  createdAt: string | null

  reportCount: number
  affectedRadiusMeters: number
}

export interface IncidentTimelineEntry {
  id: string
  type: 'report_received' | 'observation' | 'moderation'
  description: string
  status: IncidentStatus
  observedAt?: string | null
  locationName?: string | null
  createdAt?: string | null
}

export interface IncidentDetail extends Incident {
  timeline: IncidentTimelineEntry[]
  mediaRefs: string[]
}

export interface CreateReportInput {
  campusId?: string
  category: IncidentCategory
  description: string
  locationName: string
  latitude: number
  longitude: number
  isAnonymous: boolean
  mediaRefs?: string[]
}

export interface CreatedReport {
  reportId: string
  incidentId: string
}
