import { apiRequest } from "./../APIRequest"
import type { ApiResponse } from "../../interface/ApiResponse"
import type { IAdminStats, IDownloadSetting } from "../../interface/IAdmin"

export const adminSystemService = {
  getAllStats: async (): Promise<ApiResponse<IAdminStats>> => {
    return apiRequest.get<IAdminStats>("admin/system/getAllStats")
  },

  getLogs: async (): Promise<ApiResponse<string>> => {
    return apiRequest.get<string>("admin/system/getLogs")
  },

  clearSearchCache: async (): Promise<ApiResponse<null>> => {
    return apiRequest.post<null>("admin/system/clearCache", {})
  },

  clearPreviewCache: async (): Promise<ApiResponse<null>> => {
    return apiRequest.post<null>("admin/system/clearPreviews", {})
  },

  getDownloadSettings: async (): Promise<ApiResponse<IDownloadSetting[]>> => {
    return apiRequest.get<IDownloadSetting[]>("admin/system/getDownloadSettings")
  },

  updateDownloadSetting: async (fileName: string, url: string): Promise<ApiResponse<null>> => {
    return apiRequest.put<null>("admin/system/updateDownloadSetting", { fileName, url })
  },

  updateBinaries: async (): Promise<ApiResponse<null>> => {
    return apiRequest.post<null>("admin/system/updateBinarie", {})
  },
}