export const API_URL = import.meta.env.VITE_API_URL;

export const ROLES = {
  USER: 1,
  ADMIN: 2,
  SUPERVISOR: 3,
} as const

export const USER_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  DELETE: 2,
} as const