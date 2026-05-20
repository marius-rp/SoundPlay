import type { ApiResponse } from "../interface/ApiResponse"
import type { IRole } from "../interface/IRole"
import { apiRequest } from "./APIRequest"

export const roleService = {
  getRoles: async (): Promise<ApiResponse<IRole[]>> => {
    return apiRequest.get<IRole[]>("role/all-roles")
  },
}
