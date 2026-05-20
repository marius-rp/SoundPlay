import React from "react"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  className = "",
  ...props
}) => {
  return (
    <button
      type="button"
      className={`text-[#a7a7a7] hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}
