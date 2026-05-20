import React from "react"
import { Clock, X } from "lucide-react"

interface SearchHistoryProps {
  history: string[]
  onSelect: (term: string) => void
  onRemove?: (term: string) => void
  onClear: () => void
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onRemove,
  onClear,
}) => {
  return (
    <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Recherches récentes
        </h2>
        <button
          onClick={onClear}
          className="text-sm font-bold text-gray-400 hover:text-white transition-colors hover:underline"
        >
          Effacer tout
        </button>
      </div>

      <div className="flex flex-col">
        {history.map((term, index) => (
          <div
            key={`${term}-${index}`}
            onClick={() => onSelect(term)}
            className="group flex items-center justify-between p-3 -mx-2 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4 truncate">
              <Clock size={20} className="text-gray-400 shrink-0" />
              <span className="text-white font-medium truncate text-base">
                {term}
              </span>
            </div>

            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(term)
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 transition-all hover:text-red-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchHistory
