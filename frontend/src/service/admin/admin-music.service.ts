import { apiRequest } from "./../APIRequest"
import type { ApiResponse } from "../../interface/ApiResponse"
import { type ITrack } from "../../interface/IMusic"

export const adminMusicService = {
  getAllMusics: async (): Promise<ApiResponse<ITrack[]>> => {
    return apiRequest.get<ITrack[]>("admin/musics/getAllMusics")
  },

  updateMusic: async (
    id: string,
    data: { title: string; artist: string; image: string },
  ): Promise<ApiResponse<null>> => {
    return apiRequest.put<null>(`admin/musics/updateMusic/${id}`, data)
  },

  deleteMusic: async (id: string): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>(`admin/musics/deleteMusic/${id}`)
  },
}
