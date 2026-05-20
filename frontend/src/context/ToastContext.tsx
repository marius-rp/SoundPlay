import { createContext, useContext, useState, type ReactNode } from "react"
import { Toast } from "../components/ui/Toast"

type ToastType = "success" | "error" | "info"

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    visible: boolean
  }>({
    message: "",
    type: "info",
    visible: false,
  })

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, visible: true })
  }

  const closeToast = () => {
    setToast((t) => ({ ...t, visible: false }))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
