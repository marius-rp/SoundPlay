import React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  className?: string
  onClick?: () => void
}

const BackButton: React.FC<BackButtonProps> = ({ className = "", onClick }) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`absolute top-4 left-4 z-40 bg-black/60 hover:bg-black p-2 rounded-full transition-colors flex items-center justify-center ${className}`}
      aria-label="Retour"
    >
      <ArrowLeft size={22} className="text-white" />
    </button>
  )
}

export default BackButton
