import { apiRequest } from "./APIRequest"
import type { ApiResponse } from "../interface/ApiResponse"

export const searchHistoryService = {
  getHistory: async (): Promise<ApiResponse<string[]>> => {
    return apiRequest.get<string[]>("search-history/history")
  },

  clearHistory: async (): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>("search-history/delete-history")
  },

  deleteTerm: async (term: string): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>("search-history/delete-term", { term })
  },
}
