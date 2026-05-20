import React from "react"

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  label: string
}

const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors relative ${
        active ? "text-white" : "text-gray-400 hover:text-[#1db954]"
      }`}
    >
      {icon && icon}
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1db954] rounded-t-full animate-in fade-in zoom-in duration-300"></span>
      )}
    </button>
  )
}

export default TabButton
