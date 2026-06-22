import React, { useState, useEffect } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Music,
  X,
  Mic2,
  Maximize2,
} from "lucide-react"
import { usePlayer } from "../../context/PlayerContext"
import { formatDuration } from "../../utils/date.helper"
import { IconButton } from "../../components/buttons/IconButton"
import LyricsPanel from "./LyricsPanel"

const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    isShuffle,
    togglePlayPause,
    nextTrack,
    prevTrack,
    setVolume,
    seek,
    toggleShuffle,
    stopTrack,
    isLyricsLoading,
    isLyricsOpen,
    toggleLyricsPanel,
    toggleFullScreen,
  } = usePlayer()

  const [localVolume, setLocalVolume] = useState<number>(volume)

  useEffect(() => {
    setLocalVolume(volume)
  }, [volume])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setLocalVolume(newVolume)
    setVolume(newVolume)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value))
  }

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0)
    } else {
      setVolume(1)
    }
  }

  if (!currentTrack) return null

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumePercent = localVolume * 100

  return (
    <>
      <LyricsPanel />

      <div className="w-full shrink-0 h-32 md:h-24 bg-[#181818] border-t border-[#282828] flex flex-col md:flex-row items-center justify-between px-4 pt-2 pb-5 md:py-0 z-50 text-white select-none relative gap-2 md:gap-0">
        <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0 md:min-w-[180px]">
          <div className="w-11 h-11 md:w-14 md:h-14 bg-[#282828] rounded shrink-0 overflow-hidden flex items-center justify-center">
            {currentTrack.image ? (
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music size={18} className="text-[#b3b3b3] md:size-5" />
            )}
          </div>
          <div className="flex flex-col overflow-hidden flex-1">
            <span className="text-xs md:text-sm font-medium hover:underline cursor-pointer truncate">
              {currentTrack.title}
            </span>
            <span className="text-[11px] md:text-xs text-[#b3b3b3] hover:underline hover:text-white cursor-pointer truncate transition-colors">
              {currentTrack.artist}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleLyricsPanel}
            disabled={isLyricsLoading}
            className={`md:hidden p-2 transition-colors cursor-pointer disabled:opacity-40 ${
              isLyricsOpen
                ? "text-[#1db954]"
                : "text-[#a7a7a7] hover:text-white"
            }`}
            title="Paroles"
          >
            <Mic2 size={20} />
          </button>

          <button
            type="button"
            onClick={stopTrack}
            className="md:hidden p-2 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
            title="Fermer le lecteur"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center max-w-[722px] w-full md:px-4">
          <div className="flex items-center justify-center gap-5 md:gap-4 mb-1 md:mb-2 w-full">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center hover:bg-white/10 ${
                isShuffle
                  ? "text-[#1db954] hover:text-[#1ed760]"
                  : "text-[#a7a7a7] hover:text-white"
              }`}
            >
              <Shuffle size={18} className="md:size-5" />
            </button>

            <IconButton
              icon={
                <SkipBack size={20} fill="currentColor" className="md:size-6" />
              }
              onClick={prevTrack}
            />

            <button
              onClick={togglePlayPause}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform shrink-0"
            >
              {isPlaying ? (
                <Pause
                  size={14}
                  fill="currentColor"
                  className="md:size-[18px]"
                />
              ) : (
                <Play
                  size={14}
                  fill="currentColor"
                  className="ml-0.5 md:ml-1 md:size-[18px]"
                />
              )}
            </button>

            <IconButton
              icon={
                <SkipForward
                  size={20}
                  fill="currentColor"
                  className="md:size-6"
                />
              }
              onClick={nextTrack}
            />

            <button
              type="button"
              onClick={toggleLyricsPanel}
              disabled={isLyricsLoading}
              className={`hidden md:flex p-2 rounded-full transition-colors cursor-pointer items-center justify-center hover:bg-white/10 disabled:opacity-40 ${
                isLyricsOpen
                  ? "text-[#1db954] hover:text-[#1ed760]"
                  : "text-[#a7a7a7] hover:text-white"
              }`}
              title="Paroles"
            >
              <Mic2 size={20} />
            </button>
            <button
              type="button"
              onClick={toggleFullScreen}
              className="hidden md:flex p-2 rounded-full transition-colors cursor-pointer items-center justify-center hover:bg-white/10 text-[#a7a7a7] hover:text-white"
              title="Plein écran"
            >
              <Maximize2 size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full max-w-[600px]">
            <span className="text-[10px] md:text-xs text-[#b3b3b3] min-w-8 md:min-w-10 text-right">
              {formatDuration(currentTime)}
            </span>

            <div className="relative flex-1 h-3 group cursor-pointer flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute w-full h-full opacity-0 cursor-pointer z-20 touch-none"
              />
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-[#1db954] md:group-hover:bg-[#1db954] transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div
                className="absolute h-3 w-3 bg-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>

            <span className="text-[10px] md:text-xs text-[#b3b3b3] min-w-8 md:min-w-10">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end gap-2 w-1/3 min-w-[180px]">
          <IconButton
            icon={volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            onClick={toggleMute}
          />

          <div className="relative w-24 h-1 group cursor-pointer flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={localVolume}
              onChange={handleVolumeChange}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
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

        <button
          type="button"
          onClick={stopTrack}
          title="Fermer le lecteur"
          className="hidden md:flex absolute -top-7 right-6 h-7 px-3 bg-[#181818] text-[#a7a7a7] hover:text-white transition-colors border-t border-x border-[#282828] rounded-t-md text-[11px] font-bold tracking-wide items-center gap-1.5 shadow-[0_-4px_10px_rgba(0,0,0,0.4)] cursor-pointer"
        >
          <Music size={13} />
          <span>FERMER</span>
        </button>
      </div>
    </>
  )
}

export default PlayerBar
