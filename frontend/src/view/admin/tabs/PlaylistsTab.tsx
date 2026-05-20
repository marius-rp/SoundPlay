import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Clock,
  Trash2,
  Loader2,
  Pen,
  Check,
  X,
  Camera,
  Music,
} from "lucide-react"
import { useToast } from "../../../context/ToastContext"
import { adminPlaylistService } from "../../../service/admin/admin-playlist.service"
import SearchBar from "../../../components/dropdown/SearchBar"
import Input from "../../../components/dropdown/Input"
import ConfirmModal from "../../../components/modal/ConfirmModal"

const PlaylistsTab: React.FC = () => {
  const { showToast } = useToast()

  const [playlists, setPlaylists] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [search, setSearch] = useState("")

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{
    title: string
    coverFile: File | null
    preview: string
  }>({
    title: "",
    coverFile: null,
    preview: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: 0,
    title: "",
  })

  const loadPlaylists = async () => {
    try {
      setIsFetching(true)
      const res = await adminPlaylistService.getAllPlaylists()
      if (res.success && res.data) setPlaylists(res.data)
    } catch (error) {
      showToast("Erreur lors du chargement des playlists.", "error")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    loadPlaylists()
  }, [])

  const filteredPlaylists = useMemo(() => {
    if (!search.trim()) return playlists
    const lowerSearch = search.toLowerCase()
    return playlists.filter((p) => {
      const dateStr = p.created_at
        ? new Date(p.created_at).toLocaleDateString("fr-FR")
        : ""
      return (
        p.title.toLowerCase().includes(lowerSearch) ||
        (p.creator_name &&
          p.creator_name.toLowerCase().includes(lowerSearch)) ||
        p.id.toString().includes(lowerSearch) ||
        dateStr.includes(lowerSearch)
      )
    })
  }, [playlists, search])

  const handleStartEdit = (p: any) => {
    setEditForm({
      title: p.title,
      coverFile: null,
      preview: p.cover_image || "",
    })
    setEditingId(p.id)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setEditForm({
        ...editForm,
        coverFile: file,
        preview: URL.createObjectURL(file),
      })
    }
  }

  const handleSave = async (id: number) => {
    try {
      const res = await adminPlaylistService.updatePlaylist(id, {
        title: editForm.title,
        coverFile: editForm.coverFile,
      })

      if (res.success) {
        showToast("Playlist mise à jour.", "success")
        await loadPlaylists()
        setEditingId(null)
      } else {
        showToast(res.error?.message || "Erreur.", "error")
      }
    } catch (e) {
      showToast("Erreur lors de la sauvegarde.", "error")
    }
  }

  const confirmDelete = async () => {
    try {
      const res = await adminPlaylistService.deletePlaylist(confirmDialog.id)
      if (res.success) {
        showToast("Playlist supprimée.", "success")
        setPlaylists((prev) => prev.filter((p) => p.id !== confirmDialog.id))
      }
    } catch (e) {
      showToast("Erreur.", "error")
    }
    setConfirmDialog({ isOpen: false, id: 0, title: "" })
  }

  if (isFetching)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1db954]" />
      </div>
    )

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <SearchBar
        placeholder="Rechercher par titre, créateur, ID..."
        value={search}
        onChange={setSearch}
        className="md:max-w-md"
      />

      <div className="bg-[#181818] rounded-xl border border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-left text-sm text-gray-300 min-w-[900px]">
          <thead className="bg-[#282828] text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[10%]">
                ID
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[15%]">
                Cover
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[30%]">
                Titre
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[20%]">
                Propriétaire
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[15%]">
                Date
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest text-right w-[10%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredPlaylists.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  #{p.id}
                </td>

                <td className="px-6 py-3">
                  <div className="relative w-12 h-12 group/cover">
                    {editingId === p.id ? (
                      <>
                        {(editForm.preview && editForm.preview !== "") ||
                        (p.cover_image && p.cover_image !== "") ? (
                          <img
                            src={editForm.preview || p.cover_image}
                            className="w-12 h-12 object-cover rounded shadow-lg opacity-50"
                            alt="Aperçu"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center opacity-50">
                            <Music size={16} className="text-gray-600" />
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center text-white hover:scale-110 transition-transform"
                        >
                          <Camera size={16} />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          hidden
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                      </>
                    ) :
                    p.cover_image && p.cover_image !== "" ? (
                      <img
                        src={p.cover_image}
                        className="w-12 h-12 object-cover rounded shadow-md"
                        alt="Playlist cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center">
                        <Music size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {editingId === p.id ? (
                    <Input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="h-8 text-xs w-full max-w-[250px]"
                    />
                  ) : (
                    <span
                      className="font-bold text-white block truncate max-w-[250px]"
                      title={p.title}
                    >
                      {p.title}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <span className="block truncate max-w-[200px] text-gray-400">
                    {p.creator_name || `Utilisateur n°${p.user_id}`}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Clock size={14} className="text-gray-500" />
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString("fr-FR")
                      : "Inconnue"}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === p.id ? (
                      <>
                        <button
                          onClick={() => handleSave(p.id)}
                          className="p-1.5 text-[#1db954] hover:bg-[#1db954]/20 rounded transition-colors"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-white/10 rounded transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="Modifier"
                        >
                          <Pen size={16} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              id: p.id,
                              title: p.title,
                            })
                          }
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                          title="Supprimer"
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

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: 0, title: "" })}
        title="Supprimer la playlist"
        message={`Voulez-vous supprimer "${confirmDialog.title}" ? Cette action est irréversible.`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default PlaylistsTab
