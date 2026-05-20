export interface IProxy {
  id: number
  name: string
  host: string
  port: number
  protocol: string
  username?: string
  password?: string
  provider_url?: string
  is_active: boolean
  last_status: "online" | "offline" | "untested" | "rate-limited"
  created_at: string
}
