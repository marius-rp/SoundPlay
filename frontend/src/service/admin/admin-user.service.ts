import { apiRequest } from "./../APIRequest"
import type { ApiResponse } from "../../interface/ApiResponse"
import type { IUser } from "../../interface/IUser"

export const adminUserService = {
  getAllUsers: async (): Promise<ApiResponse<IUser[]>> => {
    return apiRequest.get<IUser[]>("admin/users/getAllUsers")
  },

  createUser: async (data: any): Promise<ApiResponse<null>> => {
    return apiRequest.post<null>("admin/users/createUser", data)
  },

  updateUser: async (id: number, data: { name: string; surname: string; email: string; role_id: number }): Promise<ApiResponse<null>> => {
    return apiRequest.put<null>(`admin/users/updateUser/${id}`, data)
  },

  deleteUser: async (id: number): Promise<ApiResponse<null>> => {
    return apiRequest.delete<null>(`admin/users/deleteUser/${id}`)
  },
}