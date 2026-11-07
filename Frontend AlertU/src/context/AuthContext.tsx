
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import type { UserProfile } from '../types/user'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean

  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user] = useState<UserProfile | null>(null)
  const [isLoading] = useState(false)

  const isAuthenticated = user !== null

  const loginWithGoogle: AuthContextType['loginWithGoogle'] =
    async () => {
      throw new Error(
        'Google authentication is not configured yet.'
      )
    }

  const logout: AuthContextType['logout'] = async () => {
    throw new Error(
      'Authentication is not configured yet.'
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    )
  }

  return context
}
