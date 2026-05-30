import type { IRole } from "./IRole"

export interface IUser {
  id: number
  email: string
  name: string
  surname: string
  role?: IRole
  role_id?: number
  created_at: string
}
