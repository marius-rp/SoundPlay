export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: {
    code: string
    message: string
  } | null
}

export interface IImportCsvResponse {
  sessionId: string
  totalTracks: number
  queue: any[]
}
