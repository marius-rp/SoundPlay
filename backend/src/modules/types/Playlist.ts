export interface Playlist {
  id?: number
  user_id: number
  title: string
  description?: string
  cover_image?: string
  created_at?: Date
  updated_at?: Date
  aleatoire: boolean
}
