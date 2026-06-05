import type { IRole } from "./IRole"

export interface IUser {
  id: number
  login: string
  email?: string
  name: string
  surname: string
  role?: IRole
  role_id?: number
  created_at: string
}
