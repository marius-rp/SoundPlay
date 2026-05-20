export interface IAdminStats {
  totalUsers: number
  totalMusics: number
  totalPlaylists: number
  storageUsedMusics: string
  storageUsedCovers: string
  totalProxies: number
  onlineProxies: number
}

export interface IDownloadSetting {
  fileName: string
  url: string
  lastUpdate?: string
}
