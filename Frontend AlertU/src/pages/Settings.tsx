import { useState } from 'react'
import './Settings.css'

function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(() => {
      const saved = localStorage.getItem(
        'alertu-notifications-enabled'
      )

      return saved === null ? true : saved === 'true'
    })

  function handleNotificationChange() {
    const updated = !notificationsEnabled

    setNotificationsEnabled(updated)

    localStorage.setItem(
      'alertu-notifications-enabled',
      String(updated)
    )
  }

  return (
    <div className="settings-page">

      <section className="settings-heading">
        <p className="pulse-eyebrow">PREFERENCES</p>
        <h1>Settings</h1>
        <p>Manage your AlertU preferences.</p>
      </section>

      <section className="settings-card">
        <h2>Notifications</h2>

        <div className="settings-option">
          <div>
            <h3>In-app notifications</h3>
            <p>
              Allow AlertU to display notifications
              inside the application.
            </p>
          </div>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleNotificationChange}
            />
            <span></span>
          </label>
        </div>
      </section>

      <p className="settings-demo-notice">
        Some preferences are stored locally for this
        demonstration. Live notification services are
        not connected yet.
      </p>

    </div>
  )
}

export default Settings