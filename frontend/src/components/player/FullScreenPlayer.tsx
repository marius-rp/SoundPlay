import React, { useEffect, useRef, useState } from "react"
import {
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic2,
  Music,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react"
import { usePlayer } from "../../context/PlayerContext"
import { formatDuration } from "../../utils/date.helper"
import {
  getActiveLyricIndex,
  isSyncedLyrics,
} from "../../utils/lrcParser.helper"

const FullScreenPlayer: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    lyrics,
    isPlaying,
    togglePlayPause,
    nextTrack,
    prevTrack,
    isLyricsLoading,
    hasLyrics,
    isFullScreen,
    toggleFullScreen,
    seek,
    isShuffle,
    toggleShuffle,
    volume,
    setVolume,
    isLyricsOpen,
    toggleLyricsPanel,
  } = usePlayer()

  const [localVolume, setLocalVolume] = useState<number>(volume)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setLocalVolume(volume)
  }, [volume])

  const synced = isSyncedLyrics(lyrics)
  const activeIndex = synced ? getActiveLyricIndex(lyrics, currentTime) : -1
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumePercent = localVolume * 100

  useEffect(() => {
    if (synced && activeIndex >= 0 && lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [activeIndex, synced])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setLocalVolume(newVolume)
    setVolume(newVolume)
  }

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1)
  }

  if (!isFullScreen || !currentTrack) return null

  const showLyrics = isLyricsOpen

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-b from-[#282828] to-black flex flex-col p-6">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <span className="text-sm font-bold tracking-widest text-white/50 uppercase">
          Lecture en cours
        </span>
        <button
          onClick={toggleFullScreen}
          className="text-white/70 hover:text-white transition-all cursor-pointer"
          title="Réduire"
        >
          <Minimize2 size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto w-full gap-8 overflow-hidden min-h-0">
        <div
          className={`bg-[#282828] rounded-lg shadow-2xl overflow-hidden shrink-0 transition-all duration-300 ${
            showLyrics
              ? "w-40 h-40 md:w-56 md:h-56"
              : "w-full max-w-sm aspect-square"
          }`}
        >
          {currentTrack.image ? (
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Music size={showLyrics ? 48 : 120} />
            </div>
          )}
        </div>

        {showLyrics && (
          <div className="hidden md:flex flex-col items-start shrink-0 max-w-[180px]">
            <span className="text-xl font-bold text-white truncate w-full">
              {currentTrack.title}
            </span>
            <span className="text-sm text-white/60 truncate w-full">
              {currentTrack.artist}
            </span>
          </div>
        )}

        {showLyrics && (
          <div
            ref={lyricsContainerRef}
            className="flex-1 w-full h-[40vh] md:h-[60vh] overflow-y-auto px-4 scrollbar-hide"
            style={{ wordBreak: "break-word" }}
          >
            {isLyricsLoading ? (
              <div className="h-full flex items-center justify-center text-white/50">
                <Mic2 size={48} className="animate-pulse" />
              </div>
            ) : !hasLyrics ? (
              <div className="h-full flex items-center justify-center text-white/50 text-center">
                Aucune parole disponible
              </div>
            ) : !synced ? (
              <div className="space-y-4 text-left py-20">
                {lyrics.map((line, i) => (
                  <p
                    key={i}
                    className="text-white/70 text-2xl font-medium leading-relaxed"
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-6 text-left py-20">
                {lyrics.map((line, i) => (
                  <div
                    key={i}
                    ref={(el) => {
                      lineRefs.current[i] = el
                    }}
                    onClick={() => seek(line.time)}
                    className={`cursor-pointer transition-all duration-300 ${
                      i === activeIndex
                        ? "text-white text-4xl font-bold"
                        : "text-white/40 text-3xl font-medium hover:text-white/60"
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showLyrics && (
          <div className="flex flex-col items-center text-center mt-4 md:hidden">
            <span className="text-2xl font-bold text-white truncate max-w-xs">
              {currentTrack.title}
            </span>
            <span className="text-base text-white/60 truncate max-w-xs">
              {currentTrack.artist}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-center justify-center gap-4 border-t border-white/10 mt-6 pt-6">
        {!showLyrics && (
          <div className="hidden md:flex flex-col items-center text-center -mt-2 mb-2">
            <span className="text-2xl font-bold text-white truncate max-w-md">
              {currentTrack.title}
            </span>
            <span className="text-base text-white/60 truncate max-w-md">
              {currentTrack.artist}
            </span>
          </div>
        )}

        <div className="w-full max-w-3xl flex items-center gap-3">
          <span className="text-xs text-white/60 w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="relative flex-1 h-3 group cursor-pointer flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer z-20 touch-none"
            />
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <span className="text-xs text-white/60 w-10">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between w-full max-w-2xl">
          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-white/10 ${
              isShuffle
                ? "text-[#1db954] hover:text-[#1ed760]"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Shuffle size={20} />
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={prevTrack}
              className="text-white hover:scale-105 transition-transform cursor-pointer"
            >
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform cursor-pointer"
            >
              {isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="text-white hover:scale-105 transition-transform cursor-pointer"
            >
              <SkipForward size={32} fill="currentColor" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleLyricsPanel}
            disabled={isLyricsLoading}
            className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-white/10 disabled:opacity-40 ${
              isLyricsOpen
                ? "text-[#1db954] hover:text-[#1ed760]"
                : "text-white/70 hover:text-white"
            }`}
            title="Paroles"
          >
            <Mic2 size={20} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 w-full max-w-2xl justify-end">
          <button
            type="button"
            onClick={toggleMute}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="relative w-32 h-1 group cursor-pointer flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={localVolume}
              onChange={handleVolumeChange}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                style={{ width: `${volumePercent}%` }}
              />
            </div>
            <div
              className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
              style={{ left: `calc(${volumePercent}% - 6px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenPlayer
