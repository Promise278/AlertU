import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/auth-context'

function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    registerWithEmail,
    isAuthenticated,
    isLoading,
    authError,
    clearAuthError,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (
    location.state as {
      from?: {
        pathname?: string
        search?: string
        hash?: string
      }
    } | null
  )?.from

  const destination = from
    ? `${from.pathname ?? '/dashboard'}${from.search ?? ''}${from.hash ?? ''}`
    : '/dashboard'

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(destination, { replace: true })
    }
  }, [destination, isAuthenticated, isLoading, navigate])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')
    clearAuthError()

    const name = fullName.trim()

    if (name.length < 2) {
      setError('Enter your full name.')
      return
    }

    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }

    if (password.length < 6) {
      setError('Your password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      await registerWithEmail(name, email, password)
      navigate(destination, { replace: true })
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : 'Could not create your account. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedError = error || authError

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Create your AlertU account</h1>
          <p>
            Register with your full name, email, and password to
            report incidents and receive campus alerts.
          </p>
        </div>

        {displayedError && (
          <p role="alert" className="auth-error">
            {displayedError}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>

          <div className="auth-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="e.g. Promise Adeyemi"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@campus.edu"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <span className="auth-hint">
              Use at least 6 characters.
            </span>
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register
