import { api } from '../lib/api'
import type {
  CreateReportInput,
  CreatedReport,
  Incident,
  IncidentCategory,
  IncidentDetail,
  IncidentStatus,
  IncidentTimelineEntry,
} from '../types/incident'

interface ApiIncident {
  id: string
  campusId: string
  title: string
  category: IncidentCategory
  status: IncidentStatus
  statusLabel?: string
  publicSummary: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  expiresAt: string | null
  locationName: string
  latitude: number
  longitude: number
  affectedRadiusMeters: number
  reportCount: number
  createdAt: string | null
  timeline?: ApiTimelineEntry[]
}

interface ApiTimelineEntry {
  id: string
  type: IncidentTimelineEntry['type']
  description: string
  status: IncidentStatus
  observedAt?: string | null
  locationName?: string | null
  createdAt?: string | null
}

interface IncidentsResponse {
  data: ApiIncident[]
}

interface IncidentResponse {
  data: ApiIncident
}

interface CreateReportResponse {
  data: {
    report: { id: string }
    incidentId: string
  }
}

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  safety: 'Safety',
  harassment: 'Harassment',
  theft: 'Theft',
  vandalism: 'Vandalism',
  infrastructure: 'Infrastructure',
  medical: 'Medical',
  fire: 'Fire',
  other: 'Other',
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: 'Reported',
  candidate: 'Candidate',
  corroborated: 'Corroborated',
  under_review: 'Under review',
  verified: 'Verified',
  disputed: 'Disputed',
  rejected: 'Rejected',
  resolved: 'Resolved',
  expired: 'Expired',
  reopened: 'Reopened',
}

export const INCIDENT_CATEGORIES = Object.keys(
  INCIDENT_CATEGORY_LABELS,
) as IncidentCategory[]

export const INCIDENT_STATUSES = Object.keys(
  INCIDENT_STATUS_LABELS,
) as IncidentStatus[]

function formatIncidentTime(value: string | null): string {
  if (!value) return 'Time unavailable'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Time unavailable'

  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000),
  )

  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`

  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 7) return `${elapsedDays}d ago`

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mapIncident(incident: ApiIncident): Incident {
  return {
    id: incident.id,
    campusId: incident.campusId,
    category: incident.category,
    categoryLabel:
      INCIDENT_CATEGORY_LABELS[incident.category] ?? incident.category,
    status: incident.status,
    statusLabel:
      incident.statusLabel ??
      INCIDENT_STATUS_LABELS[incident.status] ??
      incident.status,
    title: incident.title,
    description: incident.publicSummary,
    location: incident.locationName,
    coordinates: [
      Number(incident.latitude),
      Number(incident.longitude),
    ],
    time: formatIncidentTime(
      incident.lastSeenAt ?? incident.firstSeenAt ?? incident.createdAt,
    ),
    firstSeenAt: incident.firstSeenAt,
    lastSeenAt: incident.lastSeenAt,
    expiresAt: incident.expiresAt,
    createdAt: incident.createdAt,
    reportCount: incident.reportCount,
    affectedRadiusMeters: incident.affectedRadiusMeters,
  }
}

function mapTimelineEntry(
  entry: ApiTimelineEntry,
): IncidentTimelineEntry {
  return {
    id: entry.id,
    type: entry.type,
    description: entry.description,
    status: entry.status,
    observedAt: entry.observedAt ?? null,
    locationName: entry.locationName ?? null,
    createdAt: entry.createdAt ?? null,
  }
}

export interface FetchIncidentsOptions {
  category?: IncidentCategory
  status?: IncidentStatus
  q?: string
  limit?: number
  includeResolved?: boolean
  signal?: AbortSignal
}

export async function fetchIncidents(
  options: FetchIncidentsOptions = {},
): Promise<Incident[]> {
  const params = new URLSearchParams({
    page: '1',
    limit: String(options.limit ?? 100),
    includeResolved: String(options.includeResolved ?? true),
  })

  if (options.category) params.set('category', options.category)
  if (options.status) params.set('status', options.status)
  if (options.q) params.set('q', options.q)

  const response = await api<IncidentsResponse>(
    `/incidents?${params.toString()}`,
    { signal: options.signal },
  )

  return response.data.map(mapIncident)
}

export async function fetchIncident(
  id: string,
  signal?: AbortSignal,
): Promise<IncidentDetail> {
  const response = await api<IncidentResponse>(
    `/incidents/${encodeURIComponent(id)}`,
    { signal },
  )

  return {
    ...mapIncident(response.data),
    timeline: (response.data.timeline ?? []).map(mapTimelineEntry),
  }
}

export async function createIncidentReport(
  input: CreateReportInput,
): Promise<CreatedReport> {
  const response = await api<CreateReportResponse>('/reports', {
    method: 'POST',
    body: input,
  })

  return {
    reportId: response.data.report.id,
    incidentId: response.data.incidentId,
  }
}
