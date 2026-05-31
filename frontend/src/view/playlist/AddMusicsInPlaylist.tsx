import React, { useState, useEffect } from "react"
import Modal from "../../components/modal/Modal"
import { musicYoutubeService } from "../../service/musicYoutubeService"
import { playlistTrackService } from "../../service/playlistTrackService"
import { useToast } from "../../context/ToastContext"
import { useDownload } from "../../context/DownloadContext"
import { ImportSearchStep } from "../../components/importPlaylist/ImportSearchStep"
import { ImportSummaryStep } from "../../components/importPlaylist/ImportSummaryStep"

interface AddMusicsInPlaylistProps {
  isOpen: boolean
  onClose: () => void
  playlistId: string
  queue: any[]
}

export const AddMusicsInPlaylist: React.FC<AddMusicsInPlaylistProps> = ({
  isOpen,
  onClose,
  playlistId,
  queue,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [skippedMusics, setSkippedMusics] = useState<any[]>([])

  const { showToast } = useToast()
  const { addDownload, removeDownload } = useDownload()

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setSkippedMusics([])
      setSearchResults([])
      setIsSearching(false)
    }
  }, [isOpen, queue])

  useEffect(() => {
    if (!isOpen || queue.length === 0 || currentIndex >= queue.length) return

    const searchTrack = async () => {
      setIsSearching(true)
      try {
        const query = `${queue[currentIndex].title} ${queue[currentIndex].artist}`
        const res = await musicYoutubeService.search(query)
        setSearchResults(res.success && res.data ? res.data : [])
      } catch (err) {
        showToast("Erreur lors de la recherche", "error")
      } finally {
        setIsSearching(false)
      }
    }

    searchTrack()
  }, [currentIndex, isOpen, queue])

  const handleSelect = async (music: any) => {
    const currentTrackName = music.title
    setCurrentIndex((prev) => prev + 1)

    const downloadId = `${music.id}-${Date.now()}`
    addDownload({
      id: downloadId,
      title: music.title,
      playlistName: "Import CSV",
    })

    try {
      const downloadRes = await musicYoutubeService.downloadMusic(music.id)
      if (!downloadRes.success)
        throw new Error(downloadRes.error?.message || "Échec")

      const addRes = await playlistTrackService.addTrackToPlaylist(
        playlistId,
        music.id,
      )
      if (addRes.success) {
        showToast(`'${currentTrackName}' ajouté avec succès !`, "success")
      } else {
        const isDup =
          addRes.error?.message?.includes("déjà") ||
          addRes.error?.code === "CONFLICT"
        showToast(
          isDup
            ? `'${currentTrackName}' est déjà dans la playlist !`
            : `Erreur ajout : ${currentTrackName}`,
          isDup ? "info" : "error",
        )
      }
    } catch (err: any) {
      const isDup =
        err.status === 409 ||
        err.message?.includes("déjà") ||
        err.message?.includes("Conflict")
      showToast(
        isDup
          ? `'${currentTrackName}' est déjà dans la playlist !`
          : err.message || "Erreur",
        isDup ? "info" : "error",
      )
    } finally {
      removeDownload(downloadId)
    }
  }

  const handleSkip = () => {
    setSkippedMusics((prev) => [...prev, queue[currentIndex]])
    setCurrentIndex((prev) => prev + 1)
  }

  const handleManualResolve = async (
    index: number,
    inputValue: string,
  ): Promise<boolean> => {
    try {
      const searchRes = await musicYoutubeService.search(inputValue)
      if (
        !searchRes.success ||
        !searchRes.data ||
        searchRes.data.length === 0
      ) {
        throw new Error("Impossible de trouver la vidéo.")
      }

      const targetMusic = searchRes.data[0]
      const downloadId = `${targetMusic.id}-${Date.now()}`

      addDownload({
        id: downloadId,
        title: targetMusic.title,
        playlistName: "Import Manuel",
      })

      const downloadRes = await musicYoutubeService.downloadMusic(
        targetMusic.id,
      )
      if (!downloadRes.success) {
        removeDownload(downloadId)
        throw new Error(downloadRes.error?.message || "Échec du téléchargement")
      }

      const addRes = await playlistTrackService.addTrackToPlaylist(
        playlistId,
        targetMusic.id,
      )
      removeDownload(downloadId)

      if (addRes.success) {
        showToast(`'${targetMusic.title}' ajouté avec succès !`, "success")
        setSkippedMusics((prev) => prev.filter((_, i) => i !== index))
        return true
      } else {
        const isDup =
          addRes.error?.message?.includes("déjà") ||
          addRes.error?.code === "CONFLICT"
        showToast(
          isDup
            ? `'${targetMusic.title}' est déjà dans la playlist !`
            : `Erreur ajout`,
          isDup ? "info" : "error",
        )
        if (isDup)
          setSkippedMusics((prev) => prev.filter((_, i) => i !== index))
        return isDup
      }
    } catch (err: any) {
      showToast(err.message || "Erreur lors du traitement manuel", "error")
      return false
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        currentIndex >= queue.length
          ? "Musiques ignorées - Résumé"
          : `Import: ${currentIndex + 1}/${queue.length}`
      }
    >
      <div className="p-4">
        {currentIndex < queue.length ? (
          <ImportSearchStep
            currentTrack={queue[currentIndex]}
            isSearching={isSearching}
            searchResults={searchResults}
            onSelect={handleSelect}
            onSkip={handleSkip}
          />
        ) : (
          <ImportSummaryStep
            skippedMusics={skippedMusics}
            onClose={onClose}
            onManualResolve={handleManualResolve}
          />
        )}
      </div>
    </Modal>
  )
}
