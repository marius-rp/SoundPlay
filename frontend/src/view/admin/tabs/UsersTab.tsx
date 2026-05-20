import React, { useState, useEffect, useMemo } from "react"
import { Check, Pen, Plus, Trash2, X, Loader2 } from "lucide-react"
import { useToast } from "../../../context/ToastContext"
import { adminUserService } from "../../../service/admin/admin-user.service"
import { roleService } from "../../../service/roleService"
import type { IUser } from "../../../interface/IUser"
import type { IRole } from "../../../interface/IRole"

import SearchBar from "../../../components/dropdown/SearchBar"
import Input from "../../../components/dropdown/Input"
import Badge from "../../../components/cards/Badge"
import Button from "../../../components/buttons/Button"
import Select from "../../../components/dropdown/Select"
import UserFormModal from "../../../components/modal/UserFormModal"
import ConfirmModal from "../../../components/modal/ConfirmModal"

const UsersTab: React.FC = () => {
  const { showToast } = useToast()

  const [users, setUsers] = useState<IUser[]>([])
  const [roles, setRoles] = useState<IRole[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    surname: "",
    email: "",
    role_id: 0,
  })

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  useEffect(() => {
    const loadUsersAndRoles = async () => {
      setIsFetching(true)
      try {
        const [resUsers, resRoles] = await Promise.all([
          adminUserService.getAllUsers(),
          roleService.getRoles(),
        ])
        if (resUsers.success && resUsers.data) setUsers(resUsers.data)
        if (resRoles.success && resRoles.data) setRoles(resRoles.data)
      } catch (error) {
        showToast("Erreur lors du chargement des utilisateurs.", "error")
      } finally {
        setIsFetching(false)
      }
    }
    loadUsersAndRoles()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const lowerSearch = search.toLowerCase()
    return users.filter((u) => {
      const dateStr = u.created_at
        ? new Date(u.created_at).toLocaleDateString("fr-FR")
        : ""
      return (
        u.name.toLowerCase().includes(lowerSearch) ||
        u.surname.toLowerCase().includes(lowerSearch) ||
        u.email.toLowerCase().includes(lowerSearch) ||
        u.role.type.toLowerCase().includes(lowerSearch) ||
        u.id.toString().includes(lowerSearch) ||
        dateStr.includes(lowerSearch)
      )
    })
  }, [users, search])

  const handleCreateUser = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await adminUserService.createUser(data)
      if (res.success) {
        showToast("Utilisateur créé avec succès.", "success")
        const updatedUsers = await adminUserService.getAllUsers()
        if (updatedUsers.success && updatedUsers.data)
          setUsers(updatedUsers.data)
      } else {
        showToast(res.error?.message || "Erreur lors de la création.", "error")
      }
    } catch (e) {
      showToast("Impossible de joindre le serveur.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (id: number) => {
    try {
      const res = await adminUserService.updateUser(id, editForm)
      if (res.success) {
        showToast("Utilisateur mis à jour avec succès.", "success")
        const updatedUsers = await adminUserService.getAllUsers()
        if (updatedUsers.success && updatedUsers.data)
          setUsers(updatedUsers.data)
        setEditingId(null)
      } else {
        showToast(
          res.error?.message || "Erreur lors de la modification.",
          "error",
        )
      }
    } catch (e) {
      showToast("Impossible de joindre le serveur.", "error")
    }
  }

  const handleDeleteUser = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Suppression utilisateur",
      message: `Supprimer définitivement le compte de ${name} ?`,
      onConfirm: async () => {
        try {
          const res = await adminUserService.deleteUser(id)
          if (res.success) {
            showToast("Compte supprimé.", "success")
            setUsers((prev) => prev.filter((u) => u.id !== id))
          }
        } catch (e) {
          showToast("Erreur lors de la suppression.", "error")
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }

  const handleStartEdit = (u: IUser) => {
    setEditForm({
      name: u.name || "",
      surname: u.surname || "",
      email: u.email,
      role_id: (u.role as IRole).id,
    })
    setEditingId(u.id)
  }

  if (isFetching) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1db954]" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SearchBar
          placeholder="Rechercher par nom, email, ID, rôle..."
          value={search}
          onChange={setSearch}
          className="w-full sm:max-w-md"
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Nouvel Utilisateur
        </Button>
      </div>

      <div className="bg-[#181818] rounded-xl border border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-left text-sm text-gray-300 min-w-[900px]">
          <thead className="bg-[#282828] text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[8%]">
                ID
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[25%]">
                Nom complet
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[35%]">
                Email
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[20%]">
                Rôle
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest text-right w-[12%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  #{u.id}
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="h-8 text-xs w-full"
                        placeholder="Nom"
                      />
                      <Input
                        value={editForm.surname}
                        onChange={(e) =>
                          setEditForm({ ...editForm, surname: e.target.value })
                        }
                        className="h-8 text-xs w-full"
                        placeholder="Prénom"
                      />
                    </div>
                  ) : (
                    <span className="text-white block truncate max-w-[200px]">
                      <span className="uppercase font-bold">{u.name}</span>{" "}
                      {u.surname}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <Input
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="h-8 text-xs w-full max-w-[300px]"
                    />
                  ) : (
                    <span
                      className="block truncate max-w-[300px]"
                      title={u.email}
                    >
                      {u.email}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <div className="w-full max-w-[150px]">
                      <Select
                        value={editForm.role_id}
                        onChange={(val) =>
                          setEditForm({ ...editForm, role_id: Number(val) })
                        }
                        options={roles.map((r) => ({
                          value: r.id,
                          label: r.type,
                        }))}
                      />
                    </div>
                  ) : (
                    <Badge
                      variant={u.role.type === "admin" ? "red" : "blue"}
                      size="md"
                    >
                      {u.role.type}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === u.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateUser(u.id)}
                          className="p-1.5 bg-[#1db954]/20 text-[#1db954] rounded hover:bg-[#1db954]/30"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-white/5 text-gray-400 rounded hover:bg-white/10"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="p-2 text-gray-400 hover:text-white"
                        >
                          <Pen size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteUser(u.id, `${u.name} ${u.surname}`)
                          }
                          className="p-2 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleCreateUser}
        roles={roles}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}

export default UsersTab
