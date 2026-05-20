import React from "react"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
}) => {
  return (
    <div className={`relative group ${className}`}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#1db954]"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#181818] border border-white/10 text-white rounded-full pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#1db954] transition-colors font-medium text-sm placeholder:text-gray-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          title="Effacer la recherche"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
