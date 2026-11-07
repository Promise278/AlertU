import { api } from '../lib/api'

export type AlertNotification = {
  id: string
  type: string
  title: string
  message: string
  time: string
  createdAt: string | null
  read: boolean
  data: Record<string, unknown>
}

interface ApiNotification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt: string | null
  sentAt: string | null
}

interface NotificationsResponse {
  data: ApiNotification[]
}

const READ_STORAGE_KEY = 'alertu-read-notifications'
const UPDATE_EVENT = 'alertu-notifications-updated'

function getReadNotificationIds(): string[] {
  const saved = localStorage.getItem(READ_STORAGE_KEY)

  if (!saved) return []

  try {
    const parsed = JSON.parse(saved) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function saveReadNotificationIds(ids: string[]): void {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

function formatNotificationTime(value: string | null): string {
  if (!value) return 'Recently'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Recently'

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

export async function fetchNotifications(
  signal?: AbortSignal,
): Promise<AlertNotification[]> {
  const response = await api<NotificationsResponse>(
    '/notifications?limit=100',
    { signal },
  )
  const readIds = new Set(getReadNotificationIds())

  return response.data.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    time: formatNotificationTime(
      notification.sentAt ?? notification.createdAt,
    ),
    createdAt: notification.createdAt,
    read: readIds.has(notification.id),
    data: notification.data ?? {},
  }))
}

export function markNotificationRead(id: string): void {
  const readIds = getReadNotificationIds()

  if (!readIds.includes(id)) {
    saveReadNotificationIds([...readIds, id])
  }
}

export function markAllNotificationsRead(ids: string[]): void {
  const readIds = new Set(getReadNotificationIds())
  ids.forEach((id) => readIds.add(id))
  saveReadNotificationIds([...readIds])
}

export function countUnreadNotifications(
  notifications: AlertNotification[],
): number {
  return notifications.filter((notification) => !notification.read).length
}

export function subscribeToNotificationChanges(
  callback: () => void,
): () => void {
  window.addEventListener(UPDATE_EVENT, callback)

  return () => {
    window.removeEventListener(UPDATE_EVENT, callback)
  }
}
