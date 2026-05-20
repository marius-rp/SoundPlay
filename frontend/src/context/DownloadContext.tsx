import {
  createContext,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from "react"
import { musicYoutubeService } from "../service/musicYoutubeService"

export type DownloadItem = {
  id: string
  title: string
  playlistName: string
}

type DownloadContextType = {
  activeDownloads: DownloadItem[]
  addDownload: (item: DownloadItem) => void
  removeDownload: (id: string) => void
  cancelDownload: (id: string) => void
  isCancelled: (id: string) => boolean
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined,
)

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
  const [activeDownloads, setActiveDownloads] = useState<DownloadItem[]>([])
  const cancelledIds = useRef<Set<string>>(new Set())

  const addDownload = (item: DownloadItem) => {
    cancelledIds.current.delete(item.id)
    setActiveDownloads((prev) => [...prev, item])
  }

  const removeDownload = (id: string) => {
    setActiveDownloads((prev) => prev.filter((item) => item.id !== id))
  }

  const cancelDownload = (id: string) => {
    cancelledIds.current.add(id)
    removeDownload(id)

    const trackId = id.split("-")[0]

    musicYoutubeService.cancelDownload(trackId).catch(console.error)
  }

  const isCancelled = (id: string) => {
    return cancelledIds.current.has(id)
  }

  return (
    <DownloadContext.Provider
      value={{
        activeDownloads,
        addDownload,
        removeDownload,
        cancelDownload,
        isCancelled,
      }}
    >
      {children}
    </DownloadContext.Provider>
  )
}

export const useDownload = () => {
  const ctx = useContext(DownloadContext)
  if (!ctx) throw new Error("useDownload must be used within DownloadProvider")
  return ctx
}
