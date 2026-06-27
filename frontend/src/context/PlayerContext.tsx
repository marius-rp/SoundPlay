import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react"
import { API_URL } from "../constant"
import { parseLRC, type LyricLine } from "../utils/lrcParser.helper"

export interface IPlayerTrack {
  id: string | number
  title: string
  artist: string
  image: string
  duration?: number
}

interface PlayerContextType {
  currentTrack: IPlayerTrack | null
  queue: IPlayerTrack[]
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  isShuffle: boolean
  playTrack: (
    track: IPlayerTrack,
    newQueue?: IPlayerTrack[],
    forceShuffle?: boolean,
  ) => void
  togglePlayPause: () => void
  nextTrack: () => void
  prevTrack: () => void
  setVolume: (level: number) => void
  seek: (time: number) => void
  toggleShuffle: () => void
  stopTrack: () => void
  lyrics: LyricLine[]
  isLyricsLoading: boolean
  hasLyrics: boolean
  isLyricsOpen: boolean
  toggleLyricsPanel: () => void
  closeLyricsPanel: () => void
  isFullScreen: boolean
  toggleFullScreen: () => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context)
    throw new Error("usePlayer doit être utilisé dans un PlayerProvider")
  return context
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [currentTrack, setCurrentTrack] = useState<IPlayerTrack | null>(null)
  const [queue, setQueue] = useState<IPlayerTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)

  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [volume, setVolumeState] = useState<number>(1)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  const [isShuffle, setIsShuffle] = useState<boolean>(false)
  const [unplayedIndices, setUnplayedIndices] = useState<number[]>([])

  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [isLyricsLoading, setIsLyricsLoading] = useState<boolean>(false)
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false)

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

  const lyricsRequestIdRef = useRef<string | number | null>(null)

  const nextTrackRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!currentTrack) {
      navigator.mediaSession.metadata = null
      return
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: "SoundPlay",
      artwork: [
        {
          src: currentTrack.image,
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    })

    navigator.mediaSession.setActionHandler("play", () => togglePlayPause())
    navigator.mediaSession.setActionHandler("pause", () => togglePlayPause())
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack())
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack())

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"

    if ("setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: currentTime,
      })
    }
  }, [currentTrack, isPlaying, currentTime, duration])

  const playTrack = (
    track: IPlayerTrack,
    newQueue?: IPlayerTrack[],
    forceShuffle?: boolean,
  ) => {
    const actualQueue = newQueue || queue
    if (newQueue) setQueue(newQueue)

    const idx = actualQueue.findIndex((t) => String(t.id) === String(track.id))
    setCurrentIndex(idx)
    setCurrentTrack(track)

    const shouldShuffle = forceShuffle !== undefined ? forceShuffle : isShuffle
    if (forceShuffle !== undefined) setIsShuffle(forceShuffle)

    if (shouldShuffle) {
      const initialUnplayed = actualQueue
        .map((_, i) => i)
        .filter((i) => i !== idx)
      setUnplayedIndices(initialUnplayed)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Erreur lecture manuelle:", err))
    }
  }

  const nextTrack = () => {
    if (queue.length === 0) return

    let nextIndex = currentIndex + 1

    if (isShuffle) {
      if (unplayedIndices.length === 0) {
        const allIndices = queue.map((_, i) => i)
        const randomPos = Math.floor(Math.random() * allIndices.length)
        nextIndex = allIndices[randomPos]
        setUnplayedIndices(allIndices.filter((i) => i !== nextIndex))
      } else {
        const randomPos = Math.floor(Math.random() * unplayedIndices.length)
        nextIndex = unplayedIndices[randomPos]
        setUnplayedIndices((prev) => prev.filter((i) => i !== nextIndex))
      }
    } else {
      if (nextIndex >= queue.length) {
        nextIndex = 0
      }
    }

    if (nextIndex === currentIndex && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Erreur boucle morceau unique :", err))
    }

    setCurrentIndex(nextIndex)
    setCurrentTrack(queue[nextIndex])
  }

  const prevTrack = () => {
    if (queue.length === 0) return
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      return
    }
    let prevIndex = currentIndex - 1
    if (prevIndex < 0) prevIndex = queue.length - 1
    setCurrentIndex(prevIndex)
    setCurrentTrack(queue[prevIndex])
  }

  const setVolume = (level: number) => {
    if (audioRef.current) audioRef.current.volume = level
    setVolumeState(level)
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const newShuffle = !prev
      if (newShuffle) {
        const allIndices = queue
          .map((_, i) => i)
          .filter((i) => i !== currentIndex)
        setUnplayedIndices(allIndices)
      }
      return newShuffle
    })
  }

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setIsPlaying(false)
    setCurrentTrack(null)
    setCurrentIndex(-1)
    setCurrentTime(0)
    setLyrics([])
    setIsLyricsOpen(false)
    setIsFullScreen(false)
  }

  const toggleLyricsPanel = () => setIsLyricsOpen((prev) => !prev)
  const closeLyricsPanel = () => setIsLyricsOpen(false)

  const toggleFullScreen = () => setIsFullScreen((prev) => !prev)

  useEffect(() => {
    nextTrackRef.current = nextTrack
  }, [currentIndex, queue, isShuffle, unplayedIndices])

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume

    const audio = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => {
      nextTrackRef.current()
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (currentTrack && currentTrack.id) {
      const newSrc = `${API_URL}/api/playMusic/${currentTrack.id}`

      if (audio.src !== newSrc || audio.readyState === 0) {
        audio.pause()
        audio.src = newSrc
        audio.load()
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Erreur de lecture auto :", err)
            setIsPlaying(false)
          }
        })
    } else if (currentTrack === null) {
      audio.pause()
      if (audio.src !== "") {
        audio.src = ""
      }
      setIsPlaying(false)
    }
  }, [currentTrack, currentIndex])

  useEffect(() => {
    if (!currentTrack || !currentTrack.id) {
      setLyrics([])
      return
    }

    const trackId = currentTrack.id
    lyricsRequestIdRef.current = trackId
    setLyrics([])
    setIsLyricsLoading(true)

    const fetchLyrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/playMusic/lyrics/${trackId}`, {
          credentials: "include",
        })

        if (lyricsRequestIdRef.current !== trackId) return

        if (!res.ok) {
          setLyrics([])
          return
        }

        const json = await res.json()
        if (json.success && json.data?.lyrics_lrc) {
          const parsed = parseLRC(json.data.lyrics_lrc)
          setLyrics(parsed)
        } else {
          setLyrics([])
        }
      } catch (err) {
        if (lyricsRequestIdRef.current === trackId) setLyrics([])
      } finally {
        if (lyricsRequestIdRef.current === trackId) setIsLyricsLoading(false)
      }
    }

    fetchLyrics()
  }, [currentTrack?.id])

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        volume,
        currentTime,
        duration,
        isShuffle,
        playTrack,
        togglePlayPause,
        nextTrack,
        prevTrack,
        setVolume,
        seek,
        toggleShuffle,
        stopTrack,
        lyrics,
        isLyricsLoading,
        hasLyrics: lyrics.length > 0,
        isLyricsOpen,
        toggleLyricsPanel,
        closeLyricsPanel,
        isFullScreen,
        toggleFullScreen,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}
