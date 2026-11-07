import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth-context'

import './Profile.css'

function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')

  const displayName = user?.displayName || 'AlertU member'

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Student'

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
          <p>{roleLabel} account</p>
        </div>

        <div className="profile-divider"></div>

        <div className="profile-information">

          <div className="profile-information-item">
            <span>Full name</span>
            <strong>{displayName}</strong>
          </div>

          <div className="profile-information-item">
            <span>Email address</span>
            <strong>
              {user?.email || 'Not provided'}
            </strong>
          </div>

          <div className="profile-information-item">
            <span>Campus</span>
            <strong>
              {user?.campusName || 'Not assigned'}
            </strong>
          </div>

          <div className="profile-information-item">
            <span>Account type</span>
            <strong>{roleLabel}</strong>
          </div>

        </div>

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

      </section>

    </div>
  )
}

export default Profile