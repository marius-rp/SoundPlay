import React, { useState, useEffect, useRef } from "react"
import { musicYoutubeService } from "../service/musicYoutubeService"
import { searchHistoryService } from "../service/SearchHistoryService"
import { playlistService } from "../service/playlistService"
import { playlistTrackService } from "../service/playlistTrackService"
import { type ITrack } from "../interface/IMusic"
import { type IPlaylist } from "../interface/IPlaylist"
import SearchHistory from "../components/search/SearchHistory"
import { TrackRow } from "../components/search/TrackRow"
import { SearchSkeleton } from "../components/search/SearchSkeleton"
import { EmptySearch } from "../components/search/EmptySearch"
import Modal from "../components/modal/Modal"
import SearchBar from "../components/dropdown/SearchBar"
import { useDownload } from "../context/DownloadContext"
import { useToast } from "../context/ToastContext"

const Search: React.FC = () => {
  const { showToast } = useToast()
  const { addDownload, removeDownload, isCancelled } = useDownload()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ITrack[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [currentPreviewId, setCurrentPreviewId] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false)
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [selectedTrackForAdd, setSelectedTrackForAdd] = useState<ITrack | null>(
    null,
  )

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.onended = () => {
      setCurrentPreviewId(null)
      setIsLoadingPreview(null)
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute("src")
        audioRef.current.load()
      }
    }
  }, [])

  useEffect(() => {
    const container = document.getElementById("search-container")
    const handleScroll = () => setIsScrolled((container?.scrollTop || 0) > 20)
    container?.addEventListener("scroll", handleScroll)
    return () => container?.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await searchHistoryService.getHistory()
        if (res.success && res.data) setHistory(res.data)
      } catch (err) {
        console.error("Erreur chargement historique:", err)
      }
    }
    fetchHistory()
  }, [])

  const handleRemoveHistoryTerm = async (term: string) => {
    try {
      const res = await searchHistoryService.deleteTerm(term)
      if (res.success) setHistory((prev) => prev.filter((t) => t !== term))
    } catch (err) {}
  }

  const handleClearHistory = async () => {
    try {
      const res = await searchHistoryService.clearHistory()
      if (res.success) setHistory([])
    } catch (err) {}
  }

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await musicYoutubeService.search(query)
        if (res.success && res.data) {
          setResults(res.data)
          setHistory((prev) =>
            [
              query.trim(),
              ...prev.filter(
                (t) => t.toLowerCase() !== query.trim().toLowerCase(),
              ),
            ].slice(0, 10),
          )
        }
      } catch (err) {
      } finally {
        setIsLoading(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [query])

  const handlePreview = async (track: ITrack) => {
    if (!audioRef.current) return
    if (currentPreviewId === track.id) {
      audioRef.current.pause()
      setCurrentPreviewId(null)
      setIsLoadingPreview(null)
      return
    }
    audioRef.current.pause()
    setCurrentPreviewId(track.id)
    setIsLoadingPreview(track.id)
    audioRef.current.src = musicYoutubeService.getPreview(track.id)
    try {
      await audioRef.current.play()
      setIsLoadingPreview(null)
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setCurrentPreviewId(null)
        setIsLoadingPreview(null)
      }
    }
  }

  const handleOpenPlaylistModal = async (track: ITrack) => {
    setSelectedTrackForAdd(track)
    setIsPlaylistModalOpen(true)

    try {
      const res = await playlistService.getUserPlaylists()
      if (res.success && res.data) {
        setPlaylists(res.data)
      }
    } catch (error) {
      showToast("Erreur de chargement des playlists", "error")
    }
  }

  const handleSelectPlaylist = async (playlistId: number) => {
    if (!selectedTrackForAdd) return

    const trackToAdd = selectedTrackForAdd
    const trackName = trackToAdd.title
    const targetPlaylist = playlists.find((p) => p.id === playlistId)
    const playlistName = targetPlaylist
      ? targetPlaylist.title
      : "votre playlist"

    const downloadTaskId = `${trackToAdd.id}-${Date.now()}`

    setIsPlaylistModalOpen(false)
    setSelectedTrackForAdd(null)

    try {
      const checkRes = await playlistTrackService.checkTrackInPlaylist(
        playlistId,
        trackToAdd.id,
      )

      if (checkRes.success && checkRes.data === true) {
        showToast(
          `La musique "${trackName}" est déjà dans "${playlistName}".`,
          "info",
        )
        return
      }
    } catch (error) {
      console.warn("Erreur vérification doublon", error)
    }

    addDownload({
      id: downloadTaskId,
      title: trackName,
      playlistName: playlistName,
    })

    try {
      const downloadRes = await musicYoutubeService.downloadMusic(trackToAdd.id)

      if (isCancelled(downloadTaskId)) {
        showToast(`Ajout annulé pour "${trackName}"`, "info")
        return
      }

      if (!downloadRes.success) {
        showToast(`Impossible de télécharger "${trackName}"`, "error")
        return
      }

      const addRes = await playlistTrackService.addTrackToPlaylist(
        playlistId,
        trackToAdd.id,
      )

      if (addRes.success) {
        showToast(`"${trackName}" a été ajouté à "${playlistName}"`, "success")
      } else {
        if (addRes.error?.code === "DUPLICATE_TRACK") {
          showToast(`"${trackName}" est déjà dans "${playlistName}"`, "info")
        } else {
          showToast(`Erreur lors de l'ajout à "${playlistName}"`, "error")
        }
      }
    } catch (error) {
      if (!isCancelled(downloadTaskId)) {
        showToast(`Une erreur est survenue pour "${trackName}"`, "error")
      }
    } finally {
      if (!isCancelled(downloadTaskId)) {
        removeDownload(downloadTaskId)
      }
    }
  }

  return (
    <div
      id="search-container"
      className="h-full bg-[#121212] overflow-y-auto scrollbar-hide"
    >
      <header
        className={`sticky top-0 z-30 px-4 md:px-8 py-4 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-md shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="relative w-full md:max-w-91">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Artiste, titre..."
            className="w-full"
          />
        </div>
      </header>

      <main className="px-4 md:px-8 pb-32 max-w-475 mx-auto">
        {query.length === 0 ? (
          history.length > 0 ? (
            <SearchHistory
              history={history}
              onSelect={setQuery}
              onRemove={handleRemoveHistoryTerm}
              onClear={handleClearHistory}
            />
          ) : (
            <EmptySearch />
          )
        ) : (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoading ? (
              <SearchSkeleton />
            ) : results.length > 0 ? (
              <div className="flex flex-col bg-[#181818] p-2 rounded-xl border border-white/5 shadow-2xl">
                <h2 className="text-xl font-bold text-white p-4 tracking-tight">
                  Meilleurs résultats
                </h2>
                {results.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    onPreview={handlePreview}
                    isPreviewing={currentPreviewId === track.id}
                    isLoadingPreview={isLoadingPreview === track.id}
                    onAddPlaylist={handleOpenPlaylistModal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                Aucun résultat pour "{query}"
              </div>
            )}
          </div>
        )}
      </main>

      <Modal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false)
          setSelectedTrackForAdd(null)
        }}
        title="Ajouter à une playlist"
      >
        <div className="flex flex-col gap-2 pt-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {playlists.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              Vous n'avez pas encore de playlist.
            </div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleSelectPlaylist(playlist.id)}
                className="flex items-center gap-4 w-full p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-md transition-colors text-left group"
              >
                <div className="w-12 h-12 bg-[#181818] rounded shrink-0 overflow-hidden flex items-center justify-center">
                  {playlist.cover_image ? (
                    <img
                      src={playlist.cover_image}
                      alt="cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#282828]" />
                  )}
                </div>
                <span className="flex-1 text-white font-medium truncate group-hover:text-[#1db954] transition-colors">
                  {playlist.title}
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Search
