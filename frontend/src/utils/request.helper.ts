import { API_URL } from "../constant"
import type { IPlaylist } from "../interface/IPlaylist"

export const formatPlaylistImage = (playlist: IPlaylist): IPlaylist => {
  if (playlist.cover_image && !playlist.cover_image.startsWith("http")) {
    playlist.cover_image = `${API_URL}${playlist.cover_image}`
  }
  return playlist
}