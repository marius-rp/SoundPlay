import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react"
import { API_URL } from "../constant"

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

  const nextTrackRef = useRef<() => void>(() => {})

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
  }

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
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}
