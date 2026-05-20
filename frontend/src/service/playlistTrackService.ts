import { apiRequest } from "./APIRequest"
import type { ApiResponse } from "../interface/ApiResponse"
import type { IPlaylistTrack } from "../interface/playlistTrack"

export const playlistTrackService = {
  getPlaylistTracks: async (
    playlistId: number | string,
  ): Promise<ApiResponse<IPlaylistTrack[]>> => {
    return apiRequest.get<IPlaylistTrack[]>(
      `playlist-tracks/get-tracks/${playlistId}`,
    )
  },

  checkTrackInPlaylist: async (
    playlistId: number | string,
    musicId: string,
  ): Promise<ApiResponse<boolean>> => {
    return apiRequest.get<boolean>(
      `playlist-tracks/check/${playlistId}/${musicId}`,
    )
  },

  addTrackToPlaylist: async (
    playlistId: number | string,
    musicId: string,
  ): Promise<ApiResponse<null>> => {
    return apiRequest.post<null>(`playlist-tracks/add-tracks/${playlistId}`, {
      musicId,
    })
  },

  removeTrackFromPlaylist: async (
    playlistId: number | string,
    musicId: string,
  ): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>(
      `playlist-tracks/delete-tracks/${playlistId}/${musicId}`,
    )
  },
}
