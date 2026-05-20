export interface IProxy {
  id: string
  host: string
  port: number
  protocol: "http" | "https"
  auth?: {
    username: string
    password?: string
  }
  isActive: boolean
  lastChecked?: string
  status: "online" | "offline" | "untested"
}
