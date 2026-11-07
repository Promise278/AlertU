import { useEffect, useState } from 'react'

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AlertNotification,
} from '../services/notifications'

import './Notifications.css'

function Notifications() {
  const [notifications, setNotifications] = useState<
    AlertNotification[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchNotifications(controller.signal)
      .then((records) => {
        if (active) setNotifications(records)
      })
      .catch((loadError) => {
        if (!active || controller.signal.aborted) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load notifications.',
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

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  function reloadNotifications() {
    setIsLoading(true)
    setError('')
    setReloadToken((token) => token + 1)
  }

  function handleMarkAsRead(id: string) {
    markNotificationRead(id)

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  function handleMarkAllAsRead() {
    markAllNotificationsRead(
      notifications.map((notification) => notification.id)
    )

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    )
  }

  return (
    <div className="notifications-page">

      <section className="notifications-heading">
        <div>
          <p className="pulse-eyebrow">YOUR ACTIVITY</p>
          <h1>Notifications</h1>
          <p>
            Stay updated on important campus activity.
          </p>
        </div>

        <button
          type="button"
          className="mark-all-button"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </section>

      <section className="notifications-list">

        <div className="notifications-list-heading">
          <h2>Recent notifications</h2>
          <span>{unreadCount} unread</span>
        </div>

        {isLoading ? (
          <div className="pulse-empty-state">
            <h3>Loading notifications</h3>
            <p>Fetching your latest alerts from AlertU.</p>
          </div>
        ) : error ? (
          <div className="pulse-empty-state">
            <h3>Could not load notifications</h3>
            <p>{error}</p>

            <button
              type="button"
              className="pulse-clear-button"
              onClick={reloadNotifications}
            >
              Try again
            </button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${
                notification.read ? 'read' : 'unread'
              }`}
            >
              <div className="notification-indicator"></div>

              <div className="notification-content">
                <div className="notification-topline">
                  <h3>{notification.title}</h3>
                  <span>{notification.time}</span>
                </div>

                <p>{notification.message}</p>

                {!notification.read && (
                  <button
                    type="button"
                    onClick={() =>
                      handleMarkAsRead(notification.id)
                    }
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="pulse-empty-state">
            <h3>No notifications yet</h3>
            <p>
              Important campus updates will appear here.
            </p>
          </div>
        )}

      </section>

    </div>
  )
}

export default Notifications
