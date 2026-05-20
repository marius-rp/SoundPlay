import { apiRequest } from "./APIRequest"
import { type IUser } from "../interface/IUser"
import type { ApiResponse } from "../interface/ApiResponse"

interface ChangePassword {
  oldPassword: string
  newPassword: string
}

export const login = async (credentials: {
  email: string
  password: string
}): Promise<ApiResponse<{ user: IUser }>> => {
  return apiRequest.post<{ user: IUser }>("auth/sign-in", credentials)
}

export const signUp = async (
  data: any,
): Promise<ApiResponse<{ id: number }>> => {
  return apiRequest.post<{ id: number }>("auth/sign-up", data)
}

export const getMe = async (): Promise<ApiResponse<IUser>> => {
  return apiRequest.get<IUser>("auth/me")
}

export const logout = async (): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>("auth/logout", {})
}

export const deleteAccount = async (): Promise<ApiResponse<null>> => {
  return apiRequest.delete<null>("auth/delete-account")
}

export const changePassword = async (
  data: ChangePassword,
): Promise<ApiResponse<ChangePassword>> => {
  return apiRequest.put<ChangePassword>("auth/change-password", data)
}
