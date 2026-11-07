import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'

import { api, ApiError } from '../lib/api'
import { firebaseAuth } from '../lib/firebase'
import type { UserProfile, UserRole } from '../types/user'
import { AuthContext, type AuthContextType } from './auth-context'

interface ProfileResponse {
  data: {
    id: string
    name: string | null
    email: string | null
    role: string
    campusId: string | null
    accountStatus: string
    campus: { id: string; name: string } | null
  }
}

interface AccountCheckResponse {
  data: {
    exists: boolean
    user?: ProfileResponse['data']
  }
}

const ACCOUNT_NOT_FOUND_MESSAGE =
  'No AlertU account was found for this sign-in. Please create an account first.'

const INACTIVE_ACCOUNT_MESSAGE =
  'This AlertU account is not active. Contact your campus administrator.'

const ROLE_MAP: Record<string, UserRole> = {
  student: 'student',
  moderator: 'moderator',
  admin: 'admin',
  'campus-admin': 'admin',
}

const normalizeRole = (role?: string | null): UserRole => {
  const key = String(role || 'student')
    .toLowerCase()
    .replace(/_/g, '-')

  return ROLE_MAP[key] ?? 'student'
}

const fallbackProfile = (
  firebaseUser: FirebaseUser,
): UserProfile => ({
  id: firebaseUser.uid,
  campusId: null,
  campusName: null,
  displayName:
    firebaseUser.displayName ||
    firebaseUser.email?.split('@')[0] ||
    'AlertU member',
  email: firebaseUser.email || '',
  role: 'student',
  accountStatus: 'active',
})

const profileFromResponse = (
  profile: ProfileResponse['data'],
  firebaseUser: FirebaseUser,
): UserProfile => ({
  id: profile.id,
  campusId: profile.campusId,
  campusName: profile.campus?.name ?? null,
  displayName:
    profile.name ||
    firebaseUser.displayName ||
    firebaseUser.email?.split('@')[0] ||
    'AlertU member',
  email: profile.email || firebaseUser.email || '',
  role: normalizeRole(profile.role),
  accountStatus: profile.accountStatus || 'active',
})

const describeAuthError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }

  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code || '')
      : ''
  const message = error instanceof Error ? error.message : ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Your password must be at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'This email is already linked to a different sign-in method.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase yet.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in in Firebase.'
    case 'auth/invalid-api-key':
      return 'Firebase is not configured correctly. Check the Firebase API key.'
    default:
      return message || 'Authentication failed. Please try again.'
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const authActionInProgress = useRef(false)

  const fetchExistingAccount = useCallback(
    async (): Promise<ProfileResponse['data'] | null> => {
      const response = await api<AccountCheckResponse>('/me/exists')

      if (!response.data.exists || !response.data.user) {
        return null
      }

      return response.data.user
    },
    [],
  )

  const fetchProfile = useCallback(
    async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
      const response = await api<ProfileResponse>('/me')
      return profileFromResponse(response.data, firebaseUser)
    },
    [],
  )

  const completeExistingAccountSignIn = useCallback(
    async (firebaseUser: FirebaseUser) => {
      let account: ProfileResponse['data'] | null

      try {
        account = await fetchExistingAccount()
      } catch (error) {
        await firebaseSignOut(firebaseAuth)
        setUser(null)
        throw error
      }

      if (!account) {
        await firebaseSignOut(firebaseAuth)
        setUser(null)
        throw new Error(ACCOUNT_NOT_FOUND_MESSAGE)
      }

      if (account.accountStatus !== 'active') {
        await firebaseSignOut(firebaseAuth)
        setUser(null)
        throw new Error(INACTIVE_ACCOUNT_MESSAGE)
      }

      setUser(profileFromResponse(account, firebaseUser))
    },
    [fetchExistingAccount],
  )

  const completeRegistration = useCallback(
    async (firebaseUser: FirebaseUser) => {
      try {
        const profile = await fetchProfile(firebaseUser)
        setUser(profile)
      } catch (error) {
        await firebaseSignOut(firebaseAuth)
        setUser(null)
        throw error
      }
    },
    [fetchProfile],
  )

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        if (!active) return

        if (!firebaseUser) {
          setUser(null)
          setIsLoading(false)
          return
        }

        if (authActionInProgress.current) {
          return
        }

        try {
          const account = await fetchExistingAccount()

          if (!account) {
            if (active) {
              setUser(null)
              setAuthError(ACCOUNT_NOT_FOUND_MESSAGE)
            }

            await firebaseSignOut(firebaseAuth)
            return
          }

          if (account.accountStatus !== 'active') {
            if (active) {
              setUser(null)
              setAuthError(INACTIVE_ACCOUNT_MESSAGE)
            }

            await firebaseSignOut(firebaseAuth)
            return
          }

          if (active) {
            setUser(profileFromResponse(account, firebaseUser))
            setAuthError(null)
          }
        } catch (error) {
          if (
            error instanceof ApiError &&
            (error.status === 401 || error.status === 403)
          ) {
            if (active) {
              setUser(null)
              setAuthError(describeAuthError(error))
            }

            await firebaseSignOut(firebaseAuth)
          } else if (active) {
            // The Firebase session is still valid if the API is unreachable.
            setUser(fallbackProfile(firebaseUser))
          }
        } finally {
          if (active) {
            setIsLoading(false)
          }
        }
      },
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [fetchExistingAccount])

  const loginWithGoogle = useCallback(async () => {
    authActionInProgress.current = true
    setAuthError(null)

    try {
      const credential = await signInWithPopup(
        firebaseAuth,
        new GoogleAuthProvider(),
      )

      await completeExistingAccountSignIn(credential.user)
    } catch (error) {
      const message = describeAuthError(error)
      setAuthError(message)
      throw new Error(message, { cause: error })
    } finally {
      authActionInProgress.current = false
      setIsLoading(false)
    }
  }, [completeExistingAccountSignIn])

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      authActionInProgress.current = true
      setAuthError(null)

      try {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          email.trim(),
          password,
        )

        await completeExistingAccountSignIn(credential.user)
      } catch (error) {
        const message = describeAuthError(error)
        setAuthError(message)
        throw new Error(message, { cause: error })
      } finally {
        authActionInProgress.current = false
        setIsLoading(false)
      }
    },
    [completeExistingAccountSignIn],
  )

  const registerWithEmail = useCallback(
    async (fullName: string, email: string, password: string) => {
      authActionInProgress.current = true
      setAuthError(null)

      try {
        let credential
        try {
          credential = await createUserWithEmailAndPassword(
            firebaseAuth,
            email.trim(),
            password,
          )
        } catch (error) {
          const code =
            typeof error === 'object' && error && 'code' in error
              ? String((error as { code?: string }).code || '')
              : ''

          // Firebase may have created the identity during an earlier attempt
          // even if the API profile step failed. Signing in lets /me create or
          // recover the corresponding row in the configured PostgreSQL DB.
          if (code !== 'auth/email-already-in-use') throw error

          credential = await signInWithEmailAndPassword(
            firebaseAuth,
            email.trim(),
            password,
          )
          await completeRegistration(credential.user)
          return
        }

        await updateProfile(credential.user, {
          displayName: fullName.trim(),
        })

        // Refresh the token so /me receives the name set above.
        await credential.user.getIdToken(true)
        await completeRegistration(credential.user)
      } catch (error) {
        if (firebaseAuth.currentUser) {
          await firebaseSignOut(firebaseAuth)
          setUser(null)
        }

        const message = describeAuthError(error)
        setAuthError(message)
        throw new Error(message, { cause: error })
      } finally {
        authActionInProgress.current = false
        setIsLoading(false)
      }
    },
    [completeRegistration],
  )

  const logout = useCallback(async () => {
    await firebaseSignOut(firebaseAuth)
    setUser(null)
    setAuthError(null)
    setIsLoading(false)
  }, [])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      authError,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      clearAuthError,
    }),
    [
      user,
      isLoading,
      authError,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      clearAuthError,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
