import React, { useState, useEffect } from "react"
import Modal from "../modal/Modal"
import Input from "../dropdown/Input"
import Button from "../buttons/Button"
import { type IProxy } from "../../interface/IProxy"

interface ProxyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any) => Promise<void>
  isLoading: boolean
  proxyToEdit: IProxy | null
}

const ProxyFormModal: React.FC<ProxyFormModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading,
  proxyToEdit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "",
    protocol: "http",
    username: "",
    password: "",
    provider_url: "",
  })

  useEffect(() => {
    if (isOpen) {
      if (proxyToEdit) {
        setFormData({
          name: proxyToEdit.name || "",
          host: proxyToEdit.host || "",
          port: proxyToEdit.port ? String(proxyToEdit.port) : "",
          protocol: proxyToEdit.protocol || "http",
          username: proxyToEdit.username || "",
          password: "",
          provider_url: proxyToEdit.provider_url || "",
        })
      } else {
        setFormData({
          name: "",
          host: "",
          port: "",
          protocol: "http",
          username: "",
          password: "",
          provider_url: "",
        })
      }
    }
  }, [isOpen, proxyToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onAdd(formData)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={proxyToEdit ? "Modifier le Proxy" : "Ajouter un nouveau Proxy"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col w-full">
        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto px-1 pb-20 scrollbar-thin scrollbar-thumb-white/10">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Désignation
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nom du proxy..."
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Configuration Réseau
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-3">
                <Input
                  required
                  value={formData.host}
                  onChange={(e) =>
                    setFormData({ ...formData, host: e.target.value })
                  }
                  placeholder="Hôte (IP ou Domaine)"
                  className="h-9"
                />
              </div>
              <div className="flex-1">
                <Input
                  required
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: e.target.value })
                  }
                  placeholder="Port"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Authentification (Optionnelle)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Utilisateur"
                  className="h-9"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={proxyToEdit ? "Laisser vide si inchangé..." : "Mot de passe"}
                  className="h-9"
                  required={!proxyToEdit}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 pb-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Informations Fournisseur (Optionnelle)
            </label>
            <Input
              value={formData.provider_url}
              onChange={(e) =>
                setFormData({ ...formData, provider_url: e.target.value })
              }
              placeholder="URL du dashboard (ex: https://webshare.io/...)"
              className="h-9"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-white/10 pt-4 mt-2">
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer w-full sm:w-auto h-9 text-xs"
            onClick={onClose}
          >
            Annuler
          </Button>

          <Button
            className="cursor-pointer w-full sm:w-auto h-9 text-xs"
            type="submit"
            isLoading={isLoading}
          >
            {proxyToEdit ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ProxyFormModal