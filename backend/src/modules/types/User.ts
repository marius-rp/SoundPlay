import { RowDataPacket } from "mysql2"
import { Role } from "./Role"

export interface User {
  id: number
  login: string
  email?: string
  password?: string
  name: string
  surname: string
  role?: Role
  role_id?: number
  created_at: Date
}

export interface UserRow extends User, RowDataPacket {}
