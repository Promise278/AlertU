import { useState } from 'react'
import {
  getNotifications,
  saveNotifications,
  type AlertNotification,
} from '../services/notifications'

import './Notifications.css'

function Notifications() {
  const [notifications, setNotifications] = useState<AlertNotification[]>(
    getNotifications
  )

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  function markAsRead(id: string) {
    const updated = notifications.map((notification) =>
      notification.id === id
        ? { ...notification, read: true }
        : notification
    )

    setNotifications(updated)
    saveNotifications(updated)
  }

  function markAllAsRead() {
    const updated = notifications.map((notification) => ({
      ...notification,
      read: true,
    }))

    setNotifications(updated)
    saveNotifications(updated)
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
          onClick={markAllAsRead}
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

        {notifications.length > 0 ? (
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
                    onClick={() => markAsRead(notification.id)}
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

      <p className="notifications-demo-notice">
        DEMO NOTIFICATIONS — These are sample updates, not live alerts.
      </p>

    </div>
  )
}

export default Notifications