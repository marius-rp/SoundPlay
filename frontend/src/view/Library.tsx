import React, { useState, useEffect } from "react"
import { Plus, Music, Heart, Loader2 } from "lucide-react"
import Modal from "../components/modal/Modal"
import { IconButton } from "../components/buttons/IconButton"
import { FloatingPlayButton } from "../components/buttons/FloatingPlayButton"
import { playlistService } from "../service/playlistService"
import { playlistTrackService } from "../service/playlistTrackService"
import { type IPlaylist } from "../interface/IPlaylist"
import { useNavigate } from "react-router-dom"
import { formatTracksForPlayer } from "../utils/player.helper"
import { usePlayer } from "../context/PlayerContext"
import { useToast } from "../context/ToastContext"

const Library: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { playTrack } = usePlayer()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [activeFilter, setActiveFilter] = useState("playlists")
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [loadingPlayId, setLoadingPlayId] = useState<number | null>(null)

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true)
      const res = await playlistService.getUserPlaylists()

      if (res.success && res.data) {
        setPlaylists(res.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistTitle.trim()) return

    try {
      const res = await playlistService.createPlaylist({
        title: newPlaylistTitle.trim(),
        aleatoire: true,
      })

      if (res.success) {
        await fetchPlaylists()
        setNewPlaylistTitle("")
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDirectPlay = async (
    e: React.MouseEvent,
    playlistId: number,
    isAleatoire: boolean,
  ) => {
    e.stopPropagation()

    setLoadingPlayId(playlistId)
    try {
      const res = await playlistTrackService.getPlaylistTracks(
        String(playlistId),
      )

      if (res.success && res.data && res.data.length > 0) {
        const safeTracks = formatTracksForPlayer(res.data)

        if (isAleatoire) {
          const randomStart = Math.floor(Math.random() * safeTracks.length)
          playTrack(safeTracks[randomStart], safeTracks, true)
        } else {
          playTrack(safeTracks[0], safeTracks, false)
        }
      } else {
        showToast("Cette playlist est vide.", "error")
      }
    } catch (err) {
      showToast("Erreur lors du chargement de la playlist.", "error")
    } finally {
      setLoadingPlayId(null)
    }
  }

  return (
    <div className="h-full bg-[#121212] overflow-y-auto pb-32 scrollbar-hide relative">
      <div className="absolute top-0 left-0 right-0 h-64 bg-linear-to-b from-[#1f1f1f] to-[#121212] pointer-events-none -z-10" />

      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-xl px-4 md:px-8 py-4 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bibliothèque
          </h1>

          <IconButton
            className="border-2 border-black bg-[#1db954] hover:bg-[#1db954]/50"
            icon={<Plus size={24} className="text-black" />}
            onClick={() => setIsModalOpen(true)}
            title="Créer une playlist"
          />
        </div>

        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          {["playlists", "albums"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                activeFilter === filter
                  ? "bg-white text-black"
                  : "bg-[#2a2a2a] text-white hover:bg-[#333]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-475 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Vous n'avez pas encore de playlist. Créez-en une !
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
            {playlists.map((playlist) => {
              const isLikedSongs =
                playlist.title.toLowerCase() === "titres likés"
              const trackCount = playlist.trackCount || 0
              const isThisLoading = loadingPlayId === playlist.id

              return (
                <div
                  key={playlist.id}
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                  className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all duration-300 group cursor-pointer"
                >
                  <div className="relative mb-4 aspect-square w-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-md overflow-hidden">
                    {isLikedSongs ? (
                      <div className="w-full h-full bg-linear-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                        <Heart
                          size={40}
                          fill="white"
                          className="text-white drop-shadow-md"
                        />
                      </div>
                    ) : playlist.cover_image ? (
                      <img
                        src={playlist.cover_image}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#282828] flex items-center justify-center shadow-inner">
                        <Music
                          size={40}
                          className="text-[#7f7f7f]"
                          strokeWidth={1}
                        />
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2">
                      {isThisLoading ? (
                        <div className="bg-[#1db954] p-3 rounded-full shadow-lg">
                          <Loader2
                            className="animate-spin text-black"
                            size={20}
                          />
                        </div>
                      ) : (
                        <FloatingPlayButton
                          onClick={(e) =>
                            handleDirectPlay(
                              e,
                              playlist.id,
                              Boolean(playlist.aleatoire),
                            )
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-bold text-white text-base mb-1 truncate">
                      {playlist.title}
                    </h3>
                    <p className="text-sm text-[#a7a7a7] font-medium truncate mt-1">
                      {isLikedSongs
                        ? "Vous"
                        : `Playlist • ${trackCount} titres`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer une playlist"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-6 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#a7a7a7] mb-2 block">
              Nom de la playlist
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ma super playlist..."
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.target.value)}
              className="w-full bg-[#333] border-none rounded-sm p-3 text-white focus:ring-2 focus:ring-[#1db954] outline-none text-base font-semibold transition-all placeholder:text-[#777]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 text-white font-bold hover:scale-105 transition-transform"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-[#1db954] text-black font-bold rounded-full hover:scale-105 hover:bg-[#1ed760] transition-all"
            >
              Créer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Library
