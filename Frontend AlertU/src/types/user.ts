export type UserRole = 'student' | 'moderator' | 'admin'

export interface UserProfile {
  id: string
  campusId: string | null
  campusName: string | null

  displayName: string
  email: string

  role: UserRole
  accountStatus: string
}
