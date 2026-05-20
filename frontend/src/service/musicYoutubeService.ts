import { apiRequest } from "./APIRequest"
import { type ITrack } from "../interface/IMusic"
import type { ApiResponse } from "../interface/ApiResponse"
import { API_URL } from "../constant"

export const musicYoutubeService = {
  search: async (query: string): Promise<ApiResponse<ITrack[]>> => {
    return apiRequest.get<ITrack[]>(
      `music-youtube/search?q=${encodeURIComponent(query)}`,
    )
  },

  getPreview: (id: string): string => {
    return `${API_URL}/api/music-youtube/preview/${id}`
  },

  downloadMusic: async (
    id: string,
  ): Promise<ApiResponse<{ message: string; id: string }>> => {
    return apiRequest.get<{ message: string; id: string }>(
      `music-youtube/download/${id}`,
    )
  },

  cancelDownload: async (id: string): Promise<ApiResponse<null>> => {
    return apiRequest.post<null>(`music-youtube/cancel/${id}`, {})
  },
}
