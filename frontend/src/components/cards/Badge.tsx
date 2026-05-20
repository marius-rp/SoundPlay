import React from "react"

type BadgeVariant = "blue" | "green" | "red" | "orange" | "purple" | "gray"
type BadgeSize = "sm" | "md" | "lg"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "blue",
  size = "md",
  className = "",
}) => {
  const variants: Record<BadgeVariant, string> = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-[#1db954]/10 text-[#1db954]",
    red: "bg-red-500/10 text-red-500",
    orange: "bg-orange-500/10 text-orange-500",
    purple: "bg-purple-500/10 text-purple-400",
    gray: "bg-white/5 text-gray-400",
  }

  const sizes: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-[11px]",
    lg: "px-4 py-1.5 text-[13px] tracking-widest",
  }

  return (
    <span
      className={`
        px-2 py-0.5 rounded-full 
        text-[10px] font-bold uppercase tracking-wide 
        inline-flex items-center justify-center
        ${variants[variant]} 
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge
