import React from "react"
import { Loader2 } from "lucide-react"

interface ImportSearchStepProps {
  currentTrack: { title: string; artist: string }
  isSearching: boolean
  searchResults: any[]
  onSelect: (music: any) => void
  onSkip: () => void
}

export const ImportSearchStep: React.FC<ImportSearchStepProps> = ({
  currentTrack,
  isSearching,
  searchResults,
  onSelect,
  onSkip,
}) => {
  return (
    <>
      <div className="bg-[#282828] p-3 rounded">
        <h3 className="text-lg font-bold text-white">{currentTrack?.title}</h3>
        <p className="text-sm text-gray-400">{currentTrack?.artist}</p>
      </div>

      {isSearching ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-[#1db954]" />
        </div>
      ) : (
        <div className="space-y-2 max-h-75 overflow-y-auto pr-1 custom-scrollbar">
          {searchResults.length > 0 ? (
            searchResults.map((res) => (
              <button
                key={res.id}
                onClick={() => onSelect(res)}
                className="w-full text-left p-2 hover:bg-white/10 rounded flex items-center gap-3 transition-colors"
              >
                <img
                  src={res.image}
                  alt={res.title}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="truncate">
                  <div className="text-sm text-white font-medium truncate">
                    {res.title}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {res.artist}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4">
              Aucun résultat trouvé.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Ignorer
        </button>
      </div>
    </>
  )
}
