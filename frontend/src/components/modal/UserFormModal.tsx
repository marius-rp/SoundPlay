import React, { useState } from "react"
import Modal from "./Modal"
import Input from "../dropdown/Input"
import Button from "../buttons/Button"
import type { IRole } from "../../interface/IRole"
import Select from "../dropdown/Select"

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any) => Promise<void>
  roles: IRole[]
  isLoading?: boolean
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  roles,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role_id: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAdd(formData)
    setFormData({
      name: "",
      surname: "",
      email: "",
      password: "",
      role_id: roles[0]?.id || 1,
    })
    onClose()
  }

  React.useEffect(() => {
    if (isOpen && roles.length > 0 && formData.role_id === 0) {
      setFormData((prev) => ({ ...prev, role_id: roles[0].id }))
    }
  }, [isOpen, roles])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un Utilisateur">
      <form onSubmit={handleSubmit} className="flex flex-col pt-2 w-full">
        <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto px-1 pb-2 scrollbar-thin scrollbar-thumb-white/10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Identité
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="flex-1">
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nom"
                  className="h-10 sm:h-9"
                />
              </div>
              <div className="flex-1">
                <Input
                  required
                  value={formData.surname}
                  onChange={(e) =>
                    setFormData({ ...formData, surname: e.target.value })
                  }
                  placeholder="Prénom"
                  className="h-10 sm:h-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Contact & Connexion
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <div className="flex-3">
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Adresse email"
                  className="h-10 sm:h-9"
                />
              </div>
              <div className="flex-2">
                <Input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Mot de passe"
                  className="h-10 sm:h-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Privilèges
            </label>
            <Select
              value={formData.role_id}
              onChange={(e) =>
                setFormData({ ...formData, role_id: Number(e.target.value) })
              }
              options={roles.map((r) => ({
                value: r.id,
                label: r.type.toUpperCase(),
              }))}
              className="w-full min-w-30"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-white/10 pt-4 mt-3">
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer w-full sm:w-auto h-10 sm:h-9 text-xs"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            className="cursor-pointer w-full sm:w-auto h-10 sm:h-9 text-xs"
            type="submit"
            isLoading={isLoading}
          >
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default UserFormModal
