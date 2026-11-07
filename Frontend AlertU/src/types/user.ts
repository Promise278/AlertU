export type UserRole =
  | 'student'
  | 'moderator'
  | 'campus-admin'

export interface UserProfile {
  id: string
  campusId: string

  displayName: string
  email: string

  role: UserRole

  createdAt: string
}
