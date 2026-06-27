import React, { useEffect, useState } from "react"
import { Play, Loader2, Music, Plus } from "lucide-react"
import { musicYoutubeService } from "../service/musicYoutubeService"
import type { ITrendingTrack } from "../service/musicYoutubeService"
import { API_URL } from "../constant"
import Modal from "../components/modal/Modal"
import { playlistService } from "../service/playlistService"
import { playlistTrackService } from "../service/playlistTrackService"
import { useToast } from "../context/ToastContext"
import { useDownload } from "../context/DownloadContext"
import { type IPlaylist } from "../interface/IPlaylist"

const Home: React.FC = () => {
  const { showToast } = useToast()
  const { addDownload, removeDownload, isCancelled } = useDownload()

  const [topTracks, setTopTracks] = useState<ITrendingTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [audio] = useState<HTMLAudioElement>(new Audio())
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false)
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [selectedTrackForAdd, setSelectedTrackForAdd] =
    useState<ITrendingTrack | null>(null)

  useEffect(() => {
    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [audio])

  useEffect(() => {
    const fetchTrendingTracks = async () => {
      try {
        setIsLoading(true)
        const response = await musicYoutubeService.getTrendingTracks()
        if (response.success && response.data) {
          setTopTracks(response.data)
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des musiques tendances :",
          error,
        )
      } finally {
        setIsLoading(false)
      }
    }
    fetchTrendingTracks()
  }, [])

  const tracksByGenre = topTracks.reduce(
    (acc, track) => {
      const genre = track.genre || "Autres"
      if (!acc[genre]) acc[genre] = []
      acc[genre].push(track)
      return acc
    },
    {} as Record<string, ITrendingTrack[]>,
  )

  const handlePlayPreview = async (trackId: string) => {
    if (playingId === trackId) {
      audio.pause()
      setPlayingId(null)
      setLoadingId(null)
      return
    }

    audio.pause()
    setPlayingId(trackId)
    setLoadingId(trackId)

    const previewUrl = `${API_URL}/api/music-youtube/preview/${trackId}`
    audio.src = previewUrl

    try {
      await audio.play()
      setLoadingId(null)
      audio.onended = () => setPlayingId(null)
    } catch (error) {
      console.error("Erreur lecture preview :", error)
      setPlayingId(null)
      setLoadingId(null)
    }
  }

  const handleOpenPlaylistModal = async (
    e: React.MouseEvent,
    track: ITrendingTrack,
  ) => {
    e.stopPropagation()
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
    <div className="min-h-full bg-linear-to-b from-[#222222] to-[#121212] pb-24 relative">
      <section className="px-4 md:px-8 pt-2">
        <h1 className="text-3xl font-black mb-6 tracking-tight">Bonjour</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
          </div>
        ) : (
          Object.entries(tracksByGenre).map(([genre, tracks]) => (
            <div key={genre} className="mb-10">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold tracking-tight hover:underline cursor-pointer capitalize">
                  Hits {genre.toLowerCase()}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all duration-300 group shadow-md flex flex-col"
                  >
                    <div className="relative mb-4">
                      <div className="aspect-square bg-[#333] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden relative">
                        <button
                          onClick={(e) => handleOpenPlaylistModal(e, track)}
                          className="absolute cursor-pointer top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 hover:bg-black text-white p-2 rounded-full shadow-md z-10"
                          title="Ajouter à la playlist"
                        >
                          <Plus size={18} />
                        </button>

                        {track.image ? (
                          <img
                            src={track.image}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Music size={32} className="text-[#7f7f7f]" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handlePlayPreview(track.id)}
                        className={`absolute cursor-pointer bottom-2 right-2 transition-all duration-300 z-10 ${
                          playingId === track.id || loadingId === track.id
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                        } ${
                          playingId === track.id && loadingId !== track.id
                            ? "bg-white"
                            : "bg-[#1ed760]"
                        } text-black p-3 rounded-full shadow-xl hover:scale-105`}
                      >
                        {loadingId === track.id ? (
                          <Loader2 className="w-[18px] h-[18px] animate-spin" />
                        ) : playingId === track.id ? (
                          <div className="w-[18px] h-[18px] bg-black rounded-[2px]" />
                        ) : (
                          <Play fill="black" size={18} />
                        )}
                      </button>
                    </div>

                    <h3 className="font-bold text-sm mb-1 truncate">
                      {track.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">
                      {track.artist}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

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
                className="flex items-center gap-4 w-full p-3 bg-[#2a2a2a] hover:bg-[#333] rounded-md transition-colors text-left group cursor-pointer"
              >
                <div className="w-12 h-12 bg-[#181818] rounded shrink-0 overflow-hidden flex items-center justify-center">
                  {playlist.cover_image ||
                  (playlist as any).first_track_cover ? (
                    <img
                      src={
                        playlist.cover_image ||
                        (playlist as any).first_track_cover
                      }
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                      <Music size={20} className="text-[#7f7f7f]" />
                    </div>
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

export default Home
