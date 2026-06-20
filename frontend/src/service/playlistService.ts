import { apiRequest } from "./APIRequest"
import { API_URL } from "../constant"
import type { ApiResponse, IImportCsvResponse } from "../interface/ApiResponse"
import type { IPlaylist, IPlaylistPayload } from "../interface/IPlaylist"
import { formatPlaylistImage } from "../utils/request.helper"

export const playlistService = {
  getUserPlaylists: async (): Promise<ApiResponse<IPlaylist[]>> => {
    const res = await apiRequest.get<IPlaylist[]>("playlist/userPlaylists")
    if (res.success && res.data) {
      res.data = res.data.map(formatPlaylistImage)
    }
    return res
  },

  getPlaylistById: async (id: number): Promise<ApiResponse<IPlaylist>> => {
    const res = await apiRequest.get<IPlaylist>(`playlist/playlistById/${id}`)
    if (res.success && res.data) {
      res.data = formatPlaylistImage(res.data)
    }
    return res
  },

  createPlaylist: async (
    data: IPlaylistPayload,
  ): Promise<ApiResponse<{ insertId: number }>> => {
    return apiRequest.post<{ insertId: number }>("playlist/create", data)
  },

  updatePlaylist: async (
    id: number,
    data: {
      title: string
      description: string
      coverFile?: File | null
      removeCover?: boolean
    },
  ): Promise<ApiResponse<{ cover_image?: string | null } | null>> => {
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("description", data.description)

    if (data.coverFile) {
      formData.append("cover", data.coverFile)
    }

    if (data.removeCover) {
      formData.append("removeCover", "true")
    }

    const res = await apiRequest.put<{ cover_image?: string | null } | null>(
      `playlist/update/${id}`,
      formData,
    )

    if (res.success && res.data && res.data.cover_image) {
      res.data.cover_image = `${API_URL}${res.data.cover_image}`
    }

    return res
  },

  updateAleatoirePlaylist: async (
    playlistId: number | string,
    data: Partial<IPlaylistPayload>,
  ): Promise<ApiResponse<null>> => {
    return apiRequest.put<null>(`playlist/updateAleatoire/${playlistId}`, data)
  },

  deletePlaylist: async (id: number): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>(`playlist/delete/${id}`)
  },

  importCsvToPlaylist: async (
    playlistId: number | string,
    file: File,
  ): Promise<ApiResponse<IImportCsvResponse>> => {
    const formData = new FormData()
    formData.append("file", file)

    return apiRequest.post<IImportCsvResponse>(
      `playlist/${playlistId}/import-csv`,
      formData,
    )
  },
}
