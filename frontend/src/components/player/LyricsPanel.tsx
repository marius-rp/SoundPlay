import React, { useEffect, useRef } from "react"
import { X, Music, Mic2 } from "lucide-react"
import { usePlayer } from "../../context/PlayerContext"
import {
  getActiveLyricIndex,
  isSyncedLyrics,
} from "../../utils/lrcParser.helper"

const LyricsPanel: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    lyrics,
    isLyricsLoading,
    hasLyrics,
    isLyricsOpen,
    closeLyricsPanel,
    seek,
  } = usePlayer()

  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  const synced = isSyncedLyrics(lyrics)
  const activeIndex = synced ? getActiveLyricIndex(lyrics, currentTime) : -1

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [currentTrack?.title])

  useEffect(() => {
    if (!synced || activeIndex < 0) return

    const el = lineRefs.current[activeIndex]
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [activeIndex, synced])

  if (!isLyricsOpen || !currentTrack) return null

  return (
    <div className="fixed inset-0 md:absolute md:inset-auto md:bottom-28 md:right-6 md:w-96 md:h-[28rem] bg-[#0a0a0a] md:bg-[#181818] md:rounded-xl md:shadow-2xl md:border md:border-white/10 z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#282828] rounded shrink-0 overflow-hidden flex items-center justify-center">
            {currentTrack.image ? (
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music size={16} className="text-[#7f7f7f]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">
              {currentTrack.title}
            </span>
            <span className="text-xs text-[#b3b3b3] truncate">
              {currentTrack.artist}
            </span>
          </div>
        </div>
        <button
          onClick={closeLyricsPanel}
          className="p-2 text-[#a7a7a7] hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X size={22} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 scrollbar-hide scroll-smooth"
      >
        {isLyricsLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#7f7f7f] gap-3">
            <Mic2 size={32} className="animate-pulse" />
            <p className="text-sm">Recherche des paroles...</p>
          </div>
        ) : !hasLyrics ? (
          <div className="flex flex-col items-center justify-center h-full text-[#7f7f7f] gap-3 text-center px-4">
            <Mic2 size={32} />
            <p className="text-sm">Aucune parole disponible pour ce titre.</p>
          </div>
        ) : !synced ? (
          <div className="space-y-4 text-center">
            {lyrics.map((line, i) => (
              <p
                key={i}
                className="text-lg font-medium text-[#d1d1d1] leading-relaxed break-words"
              >
                {line.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-5 text-center pb-32">
            {lyrics.map((line, i) => {
              const isActive = i === activeIndex
              return (
                <div
                  key={i}
                  ref={(el) => {
                    lineRefs.current[i] = el
                  }}
                  onClick={() => seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 origin-center min-h-[2rem] w-full break-words flex items-center justify-center px-2 ${
                    isActive
                      ? "text-white font-bold scale-110 opacity-100"
                      : "text-[#5a5a5a] text-lg font-medium hover:text-[#8a8a8a] opacity-70 scale-100"
                  }`}
                >
                  {line.text}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default LyricsPanel