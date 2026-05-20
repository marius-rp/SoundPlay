export interface IPlaylistTrack {
  id?: number
  playlist_id: number
  music_id: string
  position?: number
  added_at?: string
}

export interface IPlaylistTrackDetails extends IPlaylistTrack {
  title: string
  artist: string
  image: string
  duration: string
}
