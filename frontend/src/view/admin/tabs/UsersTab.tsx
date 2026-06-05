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
import { ROLES } from "../../../constant"
import Tooltip from "../../../components/ui/Tooltip"

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
    login: "",
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
        u.login.toLowerCase().includes(lowerSearch) ||
        u?.role?.type.toLowerCase().includes(lowerSearch) ||
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
      login: u.login,
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
          placeholder="Rechercher par nom, login, ID, rôle..."
          value={search}
          onChange={setSearch}
          className="w-full sm:max-w-md"
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm"
        >
          <Plus size={16} />
          <span className="sm:inline">Nouvel Utilisateur</span>
        </Button>
      </div>

      <div className="bg-[#181818] rounded-xl border border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-left text-sm text-gray-300 min-w-225">
          <thead className="bg-[#282828] text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[8%]">
                ID
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[25%]">
                Nom complet
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[35%]">
                Login
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
                    <div className="flex flex-col gap-1 w-full max-w-50">
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
                    <span className="text-white block truncate max-w-50">
                      <span className="uppercase font-bold">{u.name}</span>{" "}
                      {u.surname}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <Input
                      value={editForm.login}
                      onChange={(e) =>
                        setEditForm({ ...editForm, login: e.target.value })
                      }
                      className="h-8 text-xs w-full max-w-75"
                    />
                  ) : (
                    <span className="block truncate max-w-75" title={u.login}>
                      {u.login}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === u.id ? (
                    <div className="w-full max-w-37.5">
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
                      variant={u?.role?.id === ROLES.ADMIN ? "red" : "blue"}
                      size="md"
                    >
                      {u?.role?.type}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === u.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateUser(u.id)}
                          className="p-1.5 bg-[#1db954]/20 text-[#1db954] rounded hover:bg-[#1db954]/30 cursor-pointer"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-white/5 text-gray-400 rounded hover:bg-white/10 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Tooltip text="Modifier">
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <Pen size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Supprimer">
                          <button
                            onClick={() =>
                              handleDeleteUser(u.id, `${u.name} ${u.surname}`)
                            }
                            className="p-2 text-gray-500 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </Tooltip>
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
