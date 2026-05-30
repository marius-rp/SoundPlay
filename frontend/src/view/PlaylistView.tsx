import React, { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Play,
  Pause,
  Clock,
  MoreHorizontal,
  Loader2,
  Music,
  Trash2,
  Pen,
  Shuffle,
  Camera,
  Upload,
  Download,
} from "lucide-react"
import { playlistTrackService } from "../service/playlistTrackService"
import { playlistService } from "../service/playlistService"
import { useToast } from "../context/ToastContext"
import type { IPlaylistTrack } from "../interface/playlistTrack"
import type { IPlaylist } from "../interface/IPlaylist"
import { formatDuration } from "../utils/date.helper"
import { usePlayer, type IPlayerTrack } from "../context/PlayerContext"
import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from "../components/dropdown/DropdownMenu"
import Modal from "../components/modal/Modal"
import ConfirmModal from "../components/modal/ConfirmModal"
import BackButton from "../components/buttons/BackButton"
import Button from "../components/buttons/Button"
import Tooltip from "../components/ui/Tooltip"
import { FileUploadZone } from "../components/dropdown/FileUploadZone"

const PlaylistView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [tracks, setTracks] = useState<IPlaylistTrack[]>([])
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState<boolean>(false)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editForm, setEditForm] = useState<{
    title: string
    description: string
  }>({ title: "", description: "" })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)

  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlayPause,
    isShuffle,
    toggleShuffle,
  } = usePlayer()

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setIsLoading(true)
      try {
        const playlistIdNumber = Number(id)

        const [tracksRes, playlistRes] = await Promise.all([
          playlistTrackService.getPlaylistTracks(id),
          playlistService.getPlaylistById(playlistIdNumber),
        ])

        if (tracksRes.success && tracksRes.data) {
          setTracks(tracksRes.data)
        } else {
          showToast(
            tracksRes.error?.message || "Impossible de charger les musiques.",
            "error",
          )
        }

        if (playlistRes.success && playlistRes.data) {
          setPlaylist(playlistRes.data)
        }
      } catch (error) {
        showToast("Erreur réseau.", "error")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleRemoveTrack = async (musicId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!id) return

    setIsRemoving(musicId)
    try {
      const res = await playlistTrackService.removeTrackFromPlaylist(
        id,
        musicId,
      )
      if (res.success) {
        showToast("Titre retiré de la playlist.", "success")
        setTracks((prev) =>
          prev.filter((track) => String(track.id) !== musicId),
        )
      } else {
        showToast(res.error?.message || "Erreur lors du retrait.", "error")
      }
    } catch (error) {
      showToast("Erreur de connexion avec le serveur.", "error")
    } finally {
      setIsRemoving(null)
    }
  }

  const handleConfirmDeletePlaylist = async () => {
    if (!id) return
    setIsConfirmModalOpen(false)
    setIsDeletingPlaylist(true)
    try {
      const res = await playlistService.deletePlaylist(Number(id))

      if (res.success) {
        showToast("Playlist supprimée avec succès.", "success")
        navigate(-1)
      } else {
        showToast(
          res.error?.message || "Erreur lors de la suppression de la playlist.",
          "error",
        )
      }
    } catch (error) {
      showToast("Erreur de connexion avec le serveur.", "error")
    } finally {
      setIsDeletingPlaylist(false)
    }
  }

  const handleToggleShuffle = async () => {
    if (!playlist || !id) return

    const currentShuffleState = Boolean(playlist.aleatoire)
    const newShuffleState = !currentShuffleState

    setPlaylist({ ...playlist, aleatoire: newShuffleState as any })

    if (isCurrentPlaylistPlaying && isShuffle !== newShuffleState) {
      toggleShuffle()
    }

    try {
      const res = await playlistService.updateAleatoirePlaylist(Number(id), {
        aleatoire: newShuffleState,
      })

      if (res.success) {
        showToast(
          newShuffleState
            ? "Lecture aléatoire activée"
            : "Lecture aléatoire désactivée",
          "success",
        )
      } else {
        setPlaylist({ ...playlist, aleatoire: currentShuffleState as any })
        showToast("Erreur lors de la modification.", "error")
      }
    } catch (error) {
      setPlaylist({ ...playlist, aleatoire: currentShuffleState as any })
      showToast("Erreur de connexion.", "error")
    }
  }

  const handleOpenEditModal = () => {
    if (!playlist) return
    setEditForm({
      title: playlist.title,
      description: playlist.description || "",
    })
    setCoverFile(null)
    setCoverPreview(null)
    setIsEditModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !playlist) return

    if (!editForm.title.trim()) {
      return showToast("Le titre de la playlist est obligatoire.", "error")
    }

    setIsEditing(true)
    try {
      const res = await playlistService.updatePlaylist(Number(id), {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        coverFile: coverFile,
      })

      if (res.success) {
        const finalCoverUrl =
          (res.data as any)?.cover_image || playlist.cover_image
        setPlaylist({
          ...playlist,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          cover_image: finalCoverUrl,
        })
        showToast("Playlist modifiée avec succès !", "success")
        setIsEditModalOpen(false)
      } else {
        showToast(
          res.error?.message || "Erreur lors de la modification.",
          "error",
        )
      }
    } catch (error) {
      showToast("Erreur de connexion avec le serveur.", "error")
    } finally {
      setIsEditing(false)
    }
  }

  const downloadTemplateCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,TITLE,ARTIST,URL\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_imports_musiques.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCsvUpload = async (file: File) => {
    showToast(`Fichier ${file.name} prêt pour l'import.`, "info")
    setIsImportModalOpen(false)
  }

  const getPlayerSafeTracks = () => {
    return tracks.map((t) => ({
      id: t.id,
      title: t.title || "Titre inconnu",
      artist: t.artist || "Artiste inconnu",
      image: t.image || "",
      duration: t.duration,
    })) as IPlayerTrack[]
  }

  const displayCover =
    playlist?.cover_image || (playlist as any)?.first_track_cover

  const isCurrentPlaylistPlaying = tracks.some(
    (t) => String(t.id) === String(currentTrack?.id),
  )

  const isPlaylistAleatoire = Boolean(playlist?.aleatoire)

  return (
    <div className="h-full bg-[#121212] overflow-y-auto pb-32 scrollbar-hide relative text-white">
      <div className="absolute top-0 left-0 right-0 h-100 bg-linear-to-b from-[#3a3a3a] via-[#121212] to-[#121212] pointer-events-none -z-10" />

      <header className="sticky top-0 mb-5 z-30 px-4 py-4 flex items-center bg-[#121212]/80 backdrop-blur-md">
        <BackButton />
      </header>

      <section className="px-4 md:px-8 pt-4 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
        <div className="w-48 h-48 md:w-56 md:h-56 shadow-2xl bg-[#282828] shrink-0 rounded-sm overflow-hidden flex items-center justify-center">
          {displayCover ? (
            <img
              src={displayCover}
              alt={playlist?.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={64} className="text-[#7f7f7f]" strokeWidth={1} />
          )}
        </div>

        <div className="flex flex-col gap-2 w-full mt-2 md:mt-0">
          <span className="hidden md:block text-xs font-bold uppercase tracking-widest text-white">
            Playlist
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter line-clamp-2 md:mb-2 wrap-break-word">
            {isLoading ? "Chargement..." : playlist?.title}
          </h1>

          {playlist?.description && (
            <p className="text-[#b3b3b3] text-sm md:text-base max-w-2xl line-clamp-2 mt-2">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center md:justify-start gap-1 text-sm font-medium mt-2 text-[#b3b3b3]">
            <span className="text-white font-bold">
              {playlist?.user
                ? `${playlist.user.name} ${playlist.user.surname}`
                : "Vous"}
            </span>
            <span className="mx-1">•</span>
            <span>
              {tracks.length} {tracks.length > 1 ? "titres" : "titre"}
            </span>
          </div>
        </div>
      </section>

      <div className="px-4 md:px-8 py-4 flex items-center justify-center md:justify-start gap-4 md:gap-6 relative">
        <button
          disabled={tracks.length === 0}
          onClick={() => {
            if (isCurrentPlaylistPlaying) {
              togglePlayPause()
            } else {
              const safeTracks = getPlayerSafeTracks()
              if (safeTracks.length > 0) {
                if (isPlaylistAleatoire) {
                  const randomStart = Math.floor(
                    Math.random() * safeTracks.length,
                  )
                  playTrack(safeTracks[randomStart], safeTracks, true)
                } else {
                  playTrack(safeTracks[0], safeTracks, false)
                }
              }
            }
          }}
          className="w-14 h-14 bg-[#1db954] text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#1ed760] transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          {isCurrentPlaylistPlaying && isPlaying ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" className="ml-1" />
          )}
        </button>

        <Tooltip
          text={
            isPlaylistAleatoire
              ? "Désactiver la lecture aléatoire"
              : "Activer la lecture aléatoire"
          }
        >
          <button
            onClick={handleToggleShuffle}
            disabled={!playlist}
            className={`p-3 rounded-full transition-all flex items-center justify-center relative ${
              isPlaylistAleatoire
                ? "text-[#1db954] hover:text-[#1ed760]"
                : "text-[#b3b3b3] hover:text-white"
            }`}
          >
            <Shuffle size={26} />
            {isPlaylistAleatoire && (
              <span className="absolute bottom-1 w-1 h-1 bg-[#1db954] rounded-full"></span>
            )}
          </button>
        </Tooltip>

        <DropdownMenu>
          <DropdownItem icon={<Pen size={16} />} onClick={handleOpenEditModal}>
            Modifier la playlist
          </DropdownItem>
          <DropdownItem
            icon={<Upload size={16} />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Importer des musiques
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={
              isDeletingPlaylist ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )
            }
            onClick={() => setIsConfirmModalOpen(true)}
            variant="danger"
          >
            {isDeletingPlaylist ? "Suppression..." : "Supprimer la playlist"}
          </DropdownItem>
        </DropdownMenu>
      </div>

      <main className="px-2 md:px-8 pb-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#1db954] w-8 h-8" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-20 text-[#b3b3b3]">
            <p className="text-xl font-bold text-white mb-2">
              C'est un peu vide par ici.
            </p>
            <p>Commencez à ajouter des morceaux à votre playlist.</p>
          </div>
        ) : (
          <div className="w-full mt-4">
            <div className="hidden md:flex items-center px-4 py-2 text-sm text-[#b3b3b3] border-b border-white/10 mb-4">
              <div className="w-10 text-center"></div>
              <div className="flex-1">Titre</div>
              <div className="w-20 flex justify-end">
                <Clock size={16} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {tracks.map((track) => {
                const isCurrentTrack =
                  String(currentTrack?.id) === String(track.id)

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      const safeTracks = getPlayerSafeTracks()
                      const safeTrack = safeTracks.find(
                        (t) => t.id === track.id,
                      )
                      if (safeTrack) {
                        playTrack(safeTrack, safeTracks, isPlaylistAleatoire)
                      }
                    }}
                    className={`group flex items-center px-2 md:px-4 py-2 rounded-md transition-colors cursor-pointer ${
                      isRemoving === String(track.id)
                        ? "opacity-50 pointer-events-none"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="hidden md:flex w-10 shrink-0 items-center justify-center text-[#b3b3b3] relative">
                      {isCurrentTrack && isPlaying ? (
                        <Music size={16} className="text-[#1db954]" />
                      ) : (
                        <Play
                          size={16}
                          fill="white"
                          className={`text-white hidden group-hover:block ${
                            isCurrentTrack ? "text-[#1db954]" : ""
                          }`}
                        />
                      )}
                      <span
                        className={`block group-hover:hidden ${isCurrentTrack ? "text-[#1db954]" : ""}`}
                      ></span>
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-12 h-12 md:w-10 md:h-10 bg-[#282828] rounded shrink-0 overflow-hidden flex items-center justify-center">
                        {track.image ? (
                          <img
                            src={track.image}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music size={18} className="text-[#b3b3b3]" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-base md:text-sm font-medium truncate group-hover:underline ${isCurrentTrack ? "text-[#1db954]" : "text-white"}`}
                        >
                          {track.title || "Titre inconnu"}
                        </span>
                        <span className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors">
                          {track.artist || "Artiste inconnu"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 md:gap-4 ml-2 md:ml-4 text-[#b3b3b3]">
                      <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu
                          icon={<MoreHorizontal size={20} />}
                          align="right"
                        >
                          <DropdownItem
                            icon={<Trash2 size={16} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveTrack(String(track.id))
                            }}
                            variant="danger"
                          >
                            Retirer de la playlist
                          </DropdownItem>
                        </DropdownMenu>
                      </div>
                      <span className="block w-10 text-right text-xs md:text-sm">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Supprimer la playlist"
        message={`Êtes-vous sûr de vouloir supprimer la playlist "${playlist?.title}" ? Cette action est irréversible.`}
        onConfirm={handleConfirmDeletePlaylist}
        onClose={() => setIsConfirmModalOpen(false)}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier la playlist"
      >
        <form
          onSubmit={handleEditSubmit}
          className="flex flex-col gap-5 pt-4 px-1"
        >
          <div className="flex justify-center mb-2">
            <div
              className="relative w-36 h-36 bg-[#282828] shadow-lg rounded-sm overflow-hidden group cursor-pointer border border-white/10"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview || displayCover ? (
                <img
                  src={coverPreview || displayCover!}
                  alt="Aperçu"
                  className="w-full h-full object-cover group-hover:blur-[2px] transition-all"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-500">
                  <Music size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <Camera size={28} className="text-white mb-2" />
                <span className="text-xs font-bold">Choisir une image</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
              Nom de la playlist
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              className="bg-[#282828] text-white px-4 py-3 rounded-md outline-none focus:ring-1 focus:ring-[#1db954] w-full text-sm transition-all"
              placeholder="Ex: My Mix 2024"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              className="bg-[#282828] text-white px-4 py-3 rounded-md outline-none focus:ring-1 focus:ring-[#1db954] w-full resize-none h-28 text-sm transition-all"
              placeholder="Ajoutez une description optionnelle..."
            />
          </div>

          <Button
            type="submit"
            disabled={isEditing}
            className="mt-2 cursor-pointer bg-white text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center"
          >
            {isEditing ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Enregistrer"
            )}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importer des musiques (.csv)"
      >
        <div className="w-full py-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
            <div>
              <p className="text-xs font-bold text-white">
                Structure requise du fichier
              </p>
              <p className="text-[11px] text-gray-400">
                Téléchargez le modèle contenant les en-têtes indispensables.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplateCsv}
              className="flex items-center gap-2 text-xs font-bold text-[#1db954] hover:text-[#1ed760] transition-colors bg-[#1db954]/10 hover:bg-[#1db954]/20 px-3 py-1.5 rounded-full border border-[#1db954]/20 whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <Download size={14} />
              Télécharger le template
            </button>
          </div>

          <FileUploadZone
            acceptedTypes={["text/csv", "application/vnd.ms-excel", ".csv"]}
            maxSizeInMB={5}
            onUpload={handleCsvUpload}
            title="Glissez votre fichier CSV ici"
            subtitle="Format attendu : TITLE, ARTIST, URL"
          />
        </div>
      </Modal>
    </div>
  )
}

export default PlaylistView
