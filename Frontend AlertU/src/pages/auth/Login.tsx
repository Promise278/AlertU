
import { useState } from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { loginWithGoogle } = useAuth()
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

  const handleGoogleSignIn = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await loginWithGoogle()

      const destination = from
        ? `${from.pathname ?? '/'}${from.search ?? ''}${from.hash ?? ''}`
        : '/'

      navigate(destination, { replace: true })
    } catch {
      setError(
        'Google sign-in was unsuccessful. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Welcome to AlertU</h1>
          <p>
            Sign in or create an account to access your
            campus safety features.
          </p>
        </div>

        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}

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
              ? 'Connecting to Google...'
              : 'Continue with Google'}
          </span>
        </button>

        <p className="auth-footer">
          New to AlertU? Your account will be created
          automatically.
        </p>

      </div>
    </div>
  )
}

export default Login
