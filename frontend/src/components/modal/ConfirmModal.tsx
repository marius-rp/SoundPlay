import React from "react"
import Modal from "./Modal"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-6">
        <p className="text-gray-300 text-sm leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors shadow-lg cursor-pointer"
          >
            Confirmer la suppression
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
