import type { IUser } from "./IUser"

export interface IPlaylist {
  id: number
  user: IUser
  title: string
  description?: string
  cover_image?: string
  created_at?: string
  updated_at?: string
  trackCount?: number
  interface: boolean
  aleatoire: boolean
}

export interface IPlaylistPayload {
  title: string
  description?: string
  cover_image?: string
  aleatoire: boolean
}