import { apiRequest } from "./APIRequest"
import { type ITrack } from "../interface/IMusic"
import type { ApiResponse } from "../interface/ApiResponse"

export const musicYoutubeService = {
  search: async (query: string): Promise<ApiResponse<ITrack[]>> => {
    return apiRequest.get<ITrack[]>(
      `music-youtube/search?q=${encodeURIComponent(query)}`,
    )
  },

  getPreview: async (id: string): Promise<ApiResponse<{ url: string }>> => {
    return apiRequest.get<{ url: string }>(`music-youtube/preview/${id}`)
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
