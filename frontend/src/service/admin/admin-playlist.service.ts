import { apiRequest } from "./../APIRequest"
import type { ApiResponse } from "../../interface/ApiResponse"
import { type IPlaylist } from "../../interface/IPlaylist"
import { formatPlaylistImage } from "../../utils/request.helper"
import { API_URL } from "../../constant"

export const adminPlaylistService = {
  getAllPlaylists: async (): Promise<ApiResponse<IPlaylist[]>> => {
    const res = await apiRequest.get<IPlaylist[]>(
      "admin/playlists/getAllPlaylists",
    )

    if (res.success && res.data) {
      res.data = res.data.map(formatPlaylistImage)
    }
    return res
  },

  updatePlaylist: async (
    id: number,
    data: { title: string; coverFile?: File | null },
  ): Promise<ApiResponse<{ cover_image?: string } | null>> => {
    try {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("description", "")

      if (data.coverFile) {
        formData.append("cover", data.coverFile)
      }

      const res = await apiRequest.put<{ cover_image?: string } | null>(
        `admin/playlists/updatePlaylist/${id}`,
        formData,
      )
      
      if (res.success && res.data?.cover_image) {
        res.data.cover_image = `${API_URL}${res.data.cover_image}`
      }

      return res
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { code: "CLIENT_ERROR", message: "Erreur modification." },
      }
    }
  },

  deletePlaylist: async (id: number): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>(`admin/playlists/deletePlaylist/${id}`)
  },
}
