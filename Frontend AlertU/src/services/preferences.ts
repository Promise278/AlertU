import { api } from '../lib/api'

export interface NotificationPreferences {
  id: string | null
  userId: string
  enabled: boolean
  categories: string[]
  isDefault: boolean
}

interface PreferencesResponse {
  data: NotificationPreferences
}

export async function fetchNotificationPreferences(
  signal?: AbortSignal,
): Promise<NotificationPreferences> {
  const response = await api<PreferencesResponse>(
    '/notification-preferences',
    { signal },
  )
  return response.data
}

export async function updateNotificationPreferences(
  input: { enabled?: boolean; categories?: string[] },
): Promise<NotificationPreferences> {
  const response = await api<PreferencesResponse>(
    '/notification-preferences',
    {
      method: 'PUT',
      body: input,
    },
  )
  return response.data
}
