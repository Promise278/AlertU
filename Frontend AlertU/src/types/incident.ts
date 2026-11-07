
export interface Incident {
  id: string
  reference?: string
  campusId: string

  category: string
  status: 'Under review' | 'Verified' | 'Resolved'

  title: string
  description?: string

  location: string
  coordinates: [number, number]
  time: string
  createdAt?: string

  identity?: 'identified' | 'private'
  reporterId?: string

  photos?: string[]
}
