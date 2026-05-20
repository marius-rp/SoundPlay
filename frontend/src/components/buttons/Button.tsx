import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
  isLoading?: boolean
  shape?: "full" | "normal"
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading,
  shape = "normal",
  className,
  ...props
}) => {
  const baseStyles =
    "transition-all duration-200 font-bold uppercase tracking-wider active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"

  const variants = {
    primary: "bg-[#1ed760] text-black hover:scale-105 hover:bg-[#1fdf64]",
    secondary:
      "bg-transparent text-white border border-[#727272] hover:border-white hover:scale-105",
  }

  const shapeStyles =
    shape === "full" ? "w-full py-3 rounded-full" : "px-8 py-3 rounded-full"

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${shapeStyles} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Patientez...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
