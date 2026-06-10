import React, { useState, useEffect, useMemo } from "react"
import {
  Check,
  Pen,
  Plus,
  Trash2,
  X,
  Loader2,
  ShieldCheck,
  Clock,
} from "lucide-react"
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
import { ROLES, USER_STATUS } from "../../../constant"
import Tooltip from "../../../components/ui/Tooltip"
import Modal from "../../../components/modal/Modal"

const StatusBadge: React.FC<{ status: number }> = ({ status }) => {
  if (status === USER_STATUS.ACTIVE)
    return (
      <Badge variant="green" size="md">
        Actif
      </Badge>
    )
  if (status === USER_STATUS.DELETE)
    return (
      <Badge variant="red" size="md">
        Supprimé
      </Badge>
    )
  return (
    <Badge variant="orange" size="md">
      En attente
    </Badge>
  )
}

const UsersTab: React.FC = () => {
  const { showToast } = useToast()

  const [users, setUsers] = useState<IUser[]>([])
  const [roles, setRoles] = useState<IRole[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<number | "all">("all")

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{
    name: string
    surname: string
    login: string
    role_id: number
    status: typeof USER_STATUS[keyof typeof USER_STATUS]
  }>({
    name: "",
    surname: "",
    login: "",
    role_id: 0,
    status: USER_STATUS.PENDING,
  })

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  const [activateDialog, setActivateDialog] = useState({
    isOpen: false,
    userId: 0,
    userName: "",
  })

  const pendingCount = useMemo(
    () => users.filter((u) => (u as any).status === USER_STATUS.PENDING).length,
    [users],
  )

  useEffect(() => {
    const load = async () => {
      setIsFetching(true)
      try {
        const [resUsers, resRoles] = await Promise.all([
          adminUserService.getAllUsers(),
          roleService.getRoles(),
        ])
        if (resUsers.success && resUsers.data) setUsers(resUsers.data)
        if (resRoles.success && resRoles.data) setRoles(resRoles.data)
      } catch {
        showToast("Erreur lors du chargement des utilisateurs.", "error")
      } finally {
        setIsFetching(false)
      }
    }
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    let list = users
    if (statusFilter !== "all")
      list = list.filter((u) => (u as any).status === statusFilter)
    if (!search.trim()) return list
    const lowerSearch = search.toLowerCase()
    return list.filter((u) => {
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
  }, [users, search, statusFilter])

  const refreshUsers = async () => {
    const updated = await adminUserService.getAllUsers()
    if (updated.success && updated.data) setUsers(updated.data)
  }

  const handleCreateUser = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await adminUserService.createUser(data)
      if (res.success) {
        showToast("Utilisateur créé avec succès.", "success")
        await refreshUsers()
      } else {
        showToast(res.error?.message || "Erreur lors de la création.", "error")
      }
    } catch {
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
        await refreshUsers()
        setEditingId(null)
      } else {
        showToast(
          res.error?.message || "Erreur lors de la modification.",
          "error",
        )
      }
    } catch {
      showToast("Impossible de joindre le serveur.", "error")
    }
  }

  const handleDeleteUser = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Suppression utilisateur",
      message: `Supprimer le compte de ${name} ?`,
      onConfirm: async () => {
        try {
          const res = await adminUserService.deleteUser(id)
          if (res.success) {
            showToast("Compte supprimé.", "success")
            await refreshUsers()
          }
        } catch {
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
      status: (u as any).status as typeof USER_STATUS[keyof typeof USER_STATUS],
    })
    setEditingId(u.id)
  }

  const confirmActivation = async () => {
    try {
      const res = await adminUserService.updateStatus(
        activateDialog.userId,
        USER_STATUS.ACTIVE,
      )
      if (res.success) {
        showToast(
          `Compte de ${activateDialog.userName} activé avec succès.`,
          "success",
        )
        await refreshUsers()
      } else {
        showToast(res.error?.message || "Erreur.", "error")
      }
    } catch {
      showToast("Impossible de joindre le serveur.", "error")
    }
    setActivateDialog({ isOpen: false, userId: 0, userName: "" })
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
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
          <Clock size={18} className="text-yellow-400 shrink-0" />
          <p className="text-yellow-300 text-sm font-medium">
            {pendingCount} compte{pendingCount > 1 ? "s" : ""} en attente de
            validation.
          </p>
          <button
            onClick={() => setStatusFilter(USER_STATUS.PENDING)}
            className="ml-auto text-xs font-bold text-yellow-400 hover:text-yellow-300 underline cursor-pointer"
          >
            Voir
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <SearchBar
            placeholder="Rechercher par nom, login, ID, rôle..."
            value={search}
            onChange={setSearch}
            className="w-full sm:max-w-xs"
          />
          <div className="flex gap-1 bg-[#282828] rounded-lg p-1">
            {[
              { label: "Tous", value: "all" as const },
              { label: "En attente", value: USER_STATUS.PENDING },
              { label: "Actifs", value: USER_STATUS.ACTIVE },
              { label: "Supprimés", value: USER_STATUS.DELETE },
            ].map(({ label, value }) => (
              <button
                key={String(value)}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  statusFilter === value
                    ? "bg-[#1db954] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[6%]">
                ID
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[22%]">
                Nom complet
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[25%]">
                Login
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[15%]">
                Rôle
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[14%]">
                Statut
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest text-right w-[18%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((u) => {
              const userStatus = (u as any).status as typeof USER_STATUS[keyof typeof USER_STATUS]
              return (
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
                            setEditForm({
                              ...editForm,
                              surname: e.target.value,
                            })
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

                  <td className="px-6 py-4">
                    {editingId === u.id ? (
                      <div className="w-full max-w-37.5">
                        <Select
                          value={editForm.status}
                          onChange={(val) =>
                            setEditForm({ ...editForm, status: Number(val) as typeof USER_STATUS[keyof typeof USER_STATUS] })
                          }
                          options={[
                            { value: USER_STATUS.PENDING, label: "En attente" },
                            { value: USER_STATUS.ACTIVE, label: "Actif" },
                            { value: USER_STATUS.DELETE, label: "Supprimé" },
                          ]}
                        />
                      </div>
                    ) : (
                      <StatusBadge status={userStatus} />
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
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
                          {userStatus !== USER_STATUS.ACTIVE && (
                            <Tooltip text="Activer">
                              <button
                                onClick={() =>
                                  setActivateDialog({
                                    isOpen: true,
                                    userId: u.id,
                                    userName: `${u.name} ${u.surname}`,
                                  })
                                }
                                className="p-2 text-gray-400 hover:text-[#1db954] cursor-pointer transition-colors"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip text="Modifier">
                            <button
                              onClick={() => handleStartEdit(u)}
                              className="p-2 text-gray-400 hover:text-white cursor-pointer"
                            >
                              <Pen size={16} />
                            </button>
                          </Tooltip>
                          {userStatus !== USER_STATUS.DELETE && (
                            <Tooltip text="Supprimer">
                              <button
                                onClick={() =>
                                  handleDeleteUser(
                                    u.id,
                                    `${u.name} ${u.surname}`,
                                  )
                                }
                                className="p-2 text-gray-500 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Aucun utilisateur trouvé.
          </div>
        )}
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
      <Modal
        isOpen={activateDialog.isOpen}
        onClose={() =>
          setActivateDialog((prev) => ({ ...prev, isOpen: false }))
        }
        title="Activer le compte"
      >
        <div className="space-y-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            Êtes-vous sûr de vouloir activer le compte de{" "}
            <span className="font-bold text-white">
              {activateDialog.userName}
            </span>{" "}
            ? Cet utilisateur aura immédiatement accès à la plateforme.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() =>
                setActivateDialog((prev) => ({ ...prev, isOpen: false }))
              }
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={confirmActivation}
              className="px-4 py-2 text-sm font-bold text-black bg-[#1db954] hover:bg-[#1ed760] rounded-lg transition-colors cursor-pointer"
            >
              Confirmer l'activation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UsersTab
