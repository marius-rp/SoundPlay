import React, { useState, type ReactNode, useEffect, useRef } from "react"
import { MoreHorizontal } from "lucide-react"

interface DropdownMenuProps {
  children: ReactNode
  icon?: ReactNode
  align?: "left" | "right" | "auto"
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  icon,
  align = "auto",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [calculatedAlign, setCalculatedAlign] = useState<"left" | "right">(
    "left",
  )
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isOpen && menuRef.current) {
      if (align === "auto") {
        const rect = menuRef.current.getBoundingClientRect()
        if (rect.right > window.innerWidth - 250) {
          setCalculatedAlign("right")
        } else {
          setCalculatedAlign("left")
        }
      } else {
        setCalculatedAlign(align)
      }
    }

    setIsOpen(!isOpen)
  }

  const closeMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
  }

  const alignmentClass =
    calculatedAlign === "right"
      ? "right-0 origin-top-right"
      : "left-0 origin-top-left"

  return (
    <div
      className="relative inline-flex items-center justify-center"
      ref={menuRef}
    >
      <button
        className="text-[#b3b3b3] hover:text-white transition flex items-center justify-center p-2 -m-2 md:p-0 md:m-0"
        onClick={toggleMenu}
      >
        {icon || <MoreHorizontal size={28} />}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full ${alignmentClass} mt-2 w-48 md:w-56 bg-[#282828] shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-md py-1 z-50 border border-white/10 animate-in fade-in zoom-in-95 duration-100`}
          onClick={closeMenu}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  onClick: (e: React.MouseEvent) => void
  icon?: ReactNode
  children: ReactNode
  variant?: "default" | "danger"
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  onClick,
  icon,
  children,
  variant = "default",
}) => {
  const colorClass =
    variant === "danger"
      ? "text-red-500 hover:bg-red-500/10"
      : "text-gray-200 hover:bg-white/10 hover:text-white"

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left ${colorClass}`}
    >
      {icon}
      {children}
    </button>
  )
}

export const DropdownDivider: React.FC = () => (
  <div className="h-px bg-white/10 my-1" />
)
