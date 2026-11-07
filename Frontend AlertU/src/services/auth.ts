
import type { UserProfile } from '../types/user'

export interface AuthResult {
  user: UserProfile
}

export interface AuthService {
  loginWithGoogle(): Promise<AuthResult>

  logout(): Promise<void>
}
