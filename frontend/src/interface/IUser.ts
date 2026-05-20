import type { IRole } from "./IRole"

export interface IUser {
  id: number
  email: string
  name: string
  surname: string
  role: IRole
  created_at: string
}
