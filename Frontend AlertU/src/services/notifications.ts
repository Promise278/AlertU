export type AlertNotification = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

const STORAGE_KEY = 'alertu-notifications'

const initialNotifications: AlertNotification[] = [
  {
    id: '1',
    title: 'Incident verified',
    message: 'A reported security incident has been verified.',
    time: 'Today',
    read: false,
  },
  {
    id: '2',
    title: 'New campus activity',
    message: 'A new incident has been reported on campus.',
    time: 'Yesterday',
    read: false,
  },
  {
    id: '3',
    title: 'Incident resolved',
    message: 'A previously reported facilities issue has been resolved.',
    time: '2 days ago',
    read: true,
  },
]

export function getNotifications(): AlertNotification[] {
  const saved = localStorage.getItem(STORAGE_KEY)

  return saved ? JSON.parse(saved) : initialNotifications
}

export function saveNotifications(
  notifications: AlertNotification[]
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notifications)
  )

  window.dispatchEvent(
    new Event('alertu-notifications-updated')
  )
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter(
    (notification) => !notification.read
  ).length
}