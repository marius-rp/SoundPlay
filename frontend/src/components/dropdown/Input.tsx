import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
  return (
    <input
      className={`w-full outline-none transition-all duration-200 bg-[#242424] text-white px-4 py-3 rounded-md border border-transparent placeholder-[#757575] hover:border-[#535353] focus:border-white focus:bg-[#2a2a2a] text-sm ${className}`}
      {...props}
    />
  )
}

export default Input
