import { useEffect } from "react"

type ToastProps = {
  message: string
  type?: "success" | "error" | "info"
  duration?: number
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const baseStyle =
    "fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-lg text-white transition-opacity"

  const typeStyle = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }[type]

  return <div className={`${baseStyle} ${typeStyle} z-99999`}>{message}</div>
}