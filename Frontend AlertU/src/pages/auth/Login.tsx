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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    loginWithGoogle,
    loginWithEmail,
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

  const handleEmailSignIn = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')
    clearAuthError()

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setIsSubmitting(true)

    try {
      await loginWithEmail(email, password)
      navigate(destination, { replace: true })
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Sign-in failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    clearAuthError()
    setIsSubmitting(true)

    try {
      await loginWithGoogle()
      navigate(destination, { replace: true })
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Google sign-in was unsuccessful. Please try again.',
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
          <h1>Welcome to AlertU</h1>
          <p>
            Sign in to report incidents, follow campus updates,
            and receive alerts.
          </p>
        </div>

        {displayedError && (
          <p role="alert" className="auth-error">
            {displayedError}
          </p>
        )}

        <form className="auth-form" onSubmit={handleEmailSignIn}>

          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
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
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
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
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="auth-google-button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44c-.28 1.4-1.08 2.59-2.28 3.39v2.83h3.69c2.16-1.99 3.64-4.92 3.64-8.25z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.08 7.95-2.93l-3.69-2.83c-1.08.72-2.46 1.15-4.26 1.15-3.27 0-6.05-2.21-7.04-5.18H1.15v2.92C3.13 21.12 7.27 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M4.96 14.21A7.2 7.2 0 0 1 4.58 12c0-.77.13-1.52.38-2.21V6.87H1.15A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.15 5.13l3.81-2.92z"
            />
            <path
              fill="#EA4335"
              d="M12 4.61c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.09 15.24 0 12 0 7.27 0 3.13 2.88 1.15 6.87l3.81 2.92C5.95 6.82 8.73 4.61 12 4.61z"
            />
          </svg>

          <span>
            {isSubmitting
              ? 'Connecting...'
              : 'Continue with Google'}
          </span>
        </button>

        <p className="auth-footer">
          New to AlertU?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
