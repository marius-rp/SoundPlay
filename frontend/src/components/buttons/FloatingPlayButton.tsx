import React from "react"
import { Play } from "lucide-react"

interface FloatingPlayButtonProps {
  onClick?: (e: React.MouseEvent) => void
  className?: string
  iconSize?: number
}

export const FloatingPlayButton: React.FC<FloatingPlayButtonProps> = ({
  onClick,
  className = "",
  iconSize = 20,
}) => {
  return (
    <button
      onClick={onClick}
      className={`opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-[#1db954] p-3 rounded-full shadow-[0_8px_8px_rgba(0,0,0,0.3)] hover:scale-105 hover:bg-[#1ed760] active:scale-95 ${className}`}
    >
      <Play fill="black" size={iconSize} className="text-black" />
    </button>
  )
}
