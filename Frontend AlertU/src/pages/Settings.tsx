import { useEffect, useState } from 'react'

import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../services/preferences'

import './Settings.css'

function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchNotificationPreferences(controller.signal)
      .then((preferences) => {
        if (active) setNotificationsEnabled(preferences.enabled)
      })
      .catch((loadError) => {
        if (!active || controller.signal.aborted) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load your preferences.',
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  async function handleNotificationChange() {
    const updated = !notificationsEnabled

    setError('')
    setIsSaving(true)
    setNotificationsEnabled(updated)

    try {
      const preferences = await updateNotificationPreferences({
        enabled: updated,
      })
      setNotificationsEnabled(preferences.enabled)
    } catch (saveError) {
      setNotificationsEnabled(!updated)
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save your preference.',
      )
    } finally {
      setIsSaving(false)
    }
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
            <h3>Campus notifications</h3>
            <p>
              Allow AlertU to send you incident updates
              and campus alerts.
            </p>
          </div>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleNotificationChange}
              disabled={isLoading || isSaving}
            />
            <span></span>
          </label>
        </div>
      </section>

      {error && (
        <p className="settings-status settings-status-error" role="alert">
          {error}
        </p>
      )}

      {isSaving && (
        <p className="settings-status">Saving your preference...</p>
      )}

    </div>
  )
}

export default Settings
