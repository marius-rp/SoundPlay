import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

interface Option {
  value: string | number
  label: string
}

interface SelectProps {
  value: string | number
  onChange: (value: string | number) => void
  options: Option[]
  className?: string
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  const toggleOpen = () => {
    if (!isOpen) {
      updateCoords()
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener("scroll", updateCoords)
    window.addEventListener("resize", updateCoords)
    return () => {
      window.removeEventListener("scroll", updateCoords)
      window.removeEventListener("resize", updateCoords)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`flex items-center justify-between w-full h-8 px-3 text-xs text-white bg-[#2a2a2a] hover:bg-[#333333] border rounded-md transition-all duration-200 outline-none ${
          isOpen ? "border-[#555] shadow-sm" : "border-transparent"
        }`}
      >
        <span className="truncate font-medium">
          {selectedOption ? selectedOption.label : "Sélectionner..."}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-9999 mt-1.5 bg-[#282828] border border-[#3e3e3e] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
          >
            <div className="max-h-48 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-white/10">
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={`flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "text-white bg-white/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? "bg-[#1db954]" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`${isSelected ? "font-medium" : "font-normal"} truncate`}
                    >
                      {option.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default Select
