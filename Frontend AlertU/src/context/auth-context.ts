import { createContext, useContext } from 'react'

import type { UserProfile } from '../types/user'

export interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null

  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<void>
  logout: () => Promise<void>
  clearAuthError: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider',
    )
  }

  return context
}
