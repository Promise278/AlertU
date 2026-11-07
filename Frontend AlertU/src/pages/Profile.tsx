import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

import './Profile.css'

function Profile() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')

  const displayName = user?.displayName || 'Demo Student'

  const avatarInitial = displayName
    .trim()
    .charAt(0)
    .toUpperCase()

  const handleSignOut = async () => {
    setError('')
    setIsSigningOut(true)

    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      setError('Unable to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="profile-page">

      <section className="profile-heading">
        <p className="pulse-eyebrow">YOUR ACCOUNT</p>
        <h1>Profile</h1>
        <p>View your student account information.</p>
      </section>

      <section className="profile-card">

        <div className="profile-avatar">
          {avatarInitial}
        </div>

        <div className="profile-identity">
          <h2>{displayName}</h2>
          <p>
            {user?.role || 'Student account'}
          </p>
        </div>

        {!isAuthenticated && (
          <span className="profile-demo-badge">
            DEMO
          </span>
        )}

        <div className="profile-divider"></div>

        <div className="profile-information">

          <div className="profile-information-item">
            <span>Full name</span>
            <strong>{displayName}</strong>
          </div>

          <div className="profile-information-item">
            <span>Email address</span>
            <strong>
              {user?.email || 'student@example.com'}
            </strong>
          </div>

          <div className="profile-information-item">
            <span>Campus</span>
            <strong>
              {user?.campusId || 'Not assigned'}
            </strong>
          </div>

          <div className="profile-information-item">
            <span>Account type</span>
            <strong>
              {user?.role || 'Student'}
            </strong>
          </div>

        </div>

        {!isAuthenticated && (
          <p className="profile-demo-notice">
            This is demonstration account information.
            Your actual details will appear after
            authentication is connected.
          </p>
        )}

        {isAuthenticated && (
          <div className="profile-signout-section">

            {error && (
              <p className="profile-signout-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              className="profile-signout-button"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>

          </div>
        )}

      </section>

    </div>
  )
}

export default Profile