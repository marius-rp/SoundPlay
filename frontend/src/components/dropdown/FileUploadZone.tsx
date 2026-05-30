import React, { useState, useRef } from "react"
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>
  maxSizeInMB?: number
  acceptedTypes?: string[]
  title?: string
  subtitle?: string
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onUpload,
  maxSizeInMB = 10,
  acceptedTypes = [],
  title = "Glissez votre fichier ici",
  subtitle = "Ou parcourez vos fichiers locaux",
}) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (selectedFile: File): boolean => {
    setErrorMessage(null)

    if (acceptedTypes.length > 0) {
      const fileExt = `.${selectedFile.name.split(".").pop()?.toLowerCase()}`
      const isAccepted =
        acceptedTypes.includes(selectedFile.type) ||
        acceptedTypes.includes(fileExt)

      if (!isAccepted) {
        setStatus("error")
        setErrorMessage("Format de fichier non supporté.")
        return false
      }
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (selectedFile.size > maxSizeInBytes) {
      setStatus("error")
      setErrorMessage(`Le fichier est trop lourd (Max : ${maxSizeInMB} Mo).`)
      return false
    }

    return true
  }

  const handleProcessFile = async (targetFile: File) => {
    setStatus("uploading")
    try {
      await onUpload(targetFile)
      setStatus("success")
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err.message || "Une erreur est survenue.")
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
        await handleProcessFile(droppedFile)
      }
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
        await handleProcessFile(selectedFile)
      }
    }
  }

  const resetZone = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setStatus("idle")
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes.join(",")}
        onChange={handleChange}
        disabled={status === "uploading"}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => status !== "uploading" && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 group select-none ${
          status === "uploading" ? "cursor-not-allowed" : "cursor-pointer"
        } ${
          isDragActive
            ? "border-[#1db954] bg-[#1db954]/5 scale-[1.01]"
            : "border-white/10 bg-[#181818] hover:bg-[#282828] hover:border-white/20"
        }`}
      >
        {status === "idle" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#282828] group-hover:bg-[#3e3e3e] flex items-center justify-center text-[#b3b3b3] group-hover:text-white transition-colors mb-4 shadow-xl">
              <UploadCloud size={28} />
            </div>
            <p className="text-white font-bold text-base mb-1">{title}</p>
            <p className="text-[#b3b3b3] text-xs font-medium mb-4">
              {subtitle}
            </p>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
              Max. {maxSizeInMB} Mo - {acceptedTypes.length > 0 ? acceptedTypes.join(", ") : "Tous formats"}
            </span>
          </>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-bold text-sm">
              Traitement en cours...
            </p>
            <p className="text-[#b3b3b3] text-xs truncate max-w-xs mt-1 italic">
              {file?.name}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-[#1db954] mb-3">
              <CheckCircle2 size={44} className="fill-[#1db954]/10" />
            </div>
            <p className="text-white font-bold text-base">
              Fichier importé avec succès !
            </p>
            <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1.5 rounded-full text-xs text-[#b3b3b3] max-w-sm">
              <FileText size={14} className="text-[#1db954] shrink-0" />
              <span className="truncate">{file?.name}</span>
            </div>
            <button
              onClick={resetZone}
              className="mt-6 text-xs text-[#b3b3b3] hover:text-white font-bold underline underline-offset-4"
            >
              Importer un autre fichier
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-red-500 mb-3">
              <AlertCircle size={44} className="fill-red-500/10" />
            </div>
            <p className="text-white font-bold text-base">
              Échec de l'importation
            </p>
            <p className="text-red-400 text-xs mt-1 font-medium">
              {errorMessage}
            </p>
            <button
              onClick={resetZone}
              className="mt-6 bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:scale-104 active:scale-100 transition-transform"
            >
              Réessayer
            </button>
          </div>
        )}

        {file &&
          status !== "uploading" &&
          status !== "success" &&
          status !== "error" && (
            <button
              onClick={resetZone}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              title="Annuler"
            >
              <X size={16} />
            </button>
          )}
      </div>
    </div>
  )
}
