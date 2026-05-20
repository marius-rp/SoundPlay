import React, { useState, useRef, useEffect } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#282828] border border-[#3e3e3e] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                      ? "text-white bg-white/4"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${
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
        </div>
      )}
    </div>
  )
}

export default Select
