import { apiRequest } from "./../APIRequest"
import { type ApiResponse } from "../../interface/ApiResponse"
import { type IProxy } from "../../interface/IProxy"

export const adminProxyService = {
  getAllProxies: async (): Promise<ApiResponse<IProxy[]>> => {
    return apiRequest.get<IProxy[]>("admin/proxy/getAllProxies")
  },

  addProxy: async (
    proxyData: Partial<IProxy>,
  ): Promise<ApiResponse<{ id: number }>> => {
    return apiRequest.post<{ id: number }>("admin/proxy/addProxy", proxyData)
  },

  deleteProxy: async (id: number): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>(`admin/proxy/deleteProxy/${id}`)
  },

  testProxy: async (
    id: number,
  ): Promise<ApiResponse<{ status: string; message: string }>> => {
    return apiRequest.post<{ status: string; message: string }>(
      `admin/proxy/testProxy/${id}`,
      {},
    )
  },

  toggleProxy: async (
    id: number,
    isActive: boolean,
  ): Promise<ApiResponse<null>> => {
    return apiRequest.put<null>(`admin/proxy/toggleProxy/${id}`, {
      is_active: isActive,
    })
  },

  uploadProxyCsv: async (
    file: File,
  ): Promise<ApiResponse<{ total: number; added: number; failed: number }>> => {
    const formData = new FormData()
    formData.append("file", file)

    return apiRequest.post<{ total: number; added: number; failed: number }>(
      "admin/proxy/uploadProxyCsv",
      formData,
    )
  },

  testAllProxies: async (): Promise<
    ApiResponse<{
      total: number
      online: number
      offline: number
      rateLimited: number
    }>
  > => {
    return apiRequest.post<{
      total: number
      online: number
      offline: number
      rateLimited: number
    }>("admin/proxy/testAllProxies", {})
  },

  updateProxy: async (
    id: number,
    proxyData: Partial<IProxy>,
  ): Promise<ApiResponse<null>> => {
    return apiRequest.put<null>(`admin/proxy/updateProxy/${id}`, proxyData)
  },
}
