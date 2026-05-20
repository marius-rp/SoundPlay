import { apiRequest } from "./APIRequest"
import { type ITrack } from "../interface/IMusic"
import type { ApiResponse } from "../interface/ApiResponse"

export const musicService = {
  getMusicById: async (id: string): Promise<ApiResponse<ITrack>> => {
    return apiRequest.get<ITrack>(`music/getMusicById/${id}`)
  },

  
}
