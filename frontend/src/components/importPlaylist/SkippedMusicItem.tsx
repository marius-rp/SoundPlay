import React, { useState } from "react"
import { Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

interface SkippedMusicItemProps {
  music: { title: string; artist: string }
  onResolve: (url: string) => Promise<boolean>
}

export const SkippedMusicItem: React.FC<SkippedMusicItemProps> = ({
  music,
  onResolve,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async () => {
    if (!inputValue.trim()) return
    setIsProcessing(true)
    const success = await onResolve(inputValue.trim())
    if (!success) {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-[#282828] rounded-md overflow-hidden transition-colors">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex justify-between items-center p-3 hover:bg-white/5 cursor-pointer gap-4"
      >
        <div className="truncate flex-1">
          <div className="text-sm text-white font-medium truncate">
            {music.title}
          </div>
          <div className="text-xs text-gray-400 truncate">{music.artist}</div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(music.title + " " + music.artist)}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs bg-[#ff0000] hover:bg-[#cc0000] text-white px-3 py-1.5 rounded font-semibold transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <span>YouTube</span>
            <ExternalLink size={12} />
          </a>
          <div className="text-gray-400">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 bg-black/20 border-t border-white/5 space-y-3">
          <p className="text-xs text-gray-400">
            Collez l'URL complète de la vidéo ou son identifiant.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-[#121212] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#1db954]"
              disabled={isProcessing}
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !inputValue.trim()}
              className="bg-[#1db954] hover:bg-[#1ed760] disabled:bg-[#1db954]/50 disabled:cursor-not-allowed text-black font-bold px-4 py-1.5 rounded text-sm transition-colors flex items-center gap-2"
            >
              {isProcessing && <Loader2 size={14} className="animate-spin" />}
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
