import { RowDataPacket } from "mysql2"

export interface User {
  id: number
  email: string
  password?: string
  name: string
  surname: string
  role_id: number
  created_at: Date
}

export interface UserRow extends User, RowDataPacket {}
