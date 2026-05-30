import React, { useState, useEffect, useMemo, useRef } from "react"
import { Check, Pen, Trash2, X, Loader2, Music, Camera } from "lucide-react"
import { useToast } from "../../../context/ToastContext"
import { adminMusicService } from "../../../service/admin/admin-music.service"
import { type ITrack } from "../../../interface/IMusic"
import SearchBar from "../../../components/dropdown/SearchBar"
import Input from "../../../components/dropdown/Input"
import ConfirmModal from "../../../components/modal/ConfirmModal"
import Tooltip from "../../../components/ui/Tooltip"

const MusicsTab: React.FC = () => {
  const { showToast } = useToast()

  const [musics, setMusics] = useState<ITrack[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [search, setSearch] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    title: string
    artist: string
    image: string
    coverFile: File | null
    preview: string
  }>({
    title: "",
    artist: "",
    image: "",
    coverFile: null,
    preview: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: "",
    title: "",
  })

  const loadMusics = async () => {
    try {
      setIsFetching(true)
      const res = await adminMusicService.getAllMusics()
      if (res.success && res.data) setMusics(res.data)
    } catch (error) {
      showToast("Erreur lors du chargement des musiques.", "error")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    loadMusics()
  }, [])

  const filteredMusics = useMemo(() => {
    if (!search.trim()) return musics
    const lowerSearch = search.toLowerCase()
    return musics.filter(
      (m) =>
        m.title.toLowerCase().includes(lowerSearch) ||
        m.artist.toLowerCase().includes(lowerSearch) ||
        m.id.toLowerCase().includes(lowerSearch),
    )
  }, [musics, search])

  const handleStartEdit = (m: ITrack) => {
    setEditForm({
      title: m.title,
      artist: m.artist || "",
      image: m.image || "",
      coverFile: null,
      preview: m.image || "",
    })
    setEditingId(m.id)
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

  const handleSave = async (id: string) => {
    try {
      const res = await adminMusicService.updateMusic(id, {
        title: editForm.title,
        artist: editForm.artist,
        image: editForm.image,
      })

      if (res.success) {
        showToast("Musique mise à jour.", "success")
        setMusics((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  title: editForm.title,
                  artist: editForm.artist,
                  image: editForm.preview || editForm.image,
                }
              : m,
          ),
        )
        setEditingId(null)
      } else showToast(res.error?.message || "Erreur.", "error")
    } catch (e) {
      showToast("Impossible de joindre le serveur.", "error")
    }
  }

  const confirmDelete = async () => {
    try {
      const res = await adminMusicService.deleteMusic(confirmDialog.id)
      if (res.success) {
        showToast("Titre supprimé.", "success")
        setMusics((prev) => prev.filter((m) => m.id !== confirmDialog.id))
      }
    } catch (e) {
      showToast("Erreur.", "error")
    }
    setConfirmDialog({ isOpen: false, id: "", title: "" })
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
        placeholder="Rechercher par titre, artiste, ID..."
        value={search}
        onChange={setSearch}
        className="md:max-w-md"
      />

      <div className="bg-[#181818] rounded-xl border border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-left text-sm text-gray-300 min-w-225">
          <thead className="bg-[#282828] text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[25%]">
                Couverture
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[30%]">
                Titre
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[20%]">
                Artiste
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest w-[15%]">
                Identifiant
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-widest text-right w-[10%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMusics.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-3">
                  <div className="relative w-12 h-12 group/cover">
                    {editingId === m.id ? (
                      <>
                        {editForm.preview || m.image ? (
                          <img
                            src={editForm.preview || m.image}
                            className="w-12 h-12 object-cover rounded shadow-lg opacity-50"
                            alt=""
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center opacity-50">
                            <Music size={16} className="text-gray-600" />
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
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
                    ) : m.image ? (
                      <img
                        src={m.image}
                        className="w-12 h-12 object-cover rounded shadow-md"
                        alt=""
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#282828] rounded flex items-center justify-center">
                        <Music size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingId === m.id ? (
                    <Input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="h-8 text-xs w-full max-w-62.5"
                    />
                  ) : (
                    <span
                      className="font-bold text-white block truncate max-w-62.5"
                      title={m.title}
                    >
                      {m.title}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === m.id ? (
                    <Input
                      value={editForm.artist}
                      onChange={(e) =>
                        setEditForm({ ...editForm, artist: e.target.value })
                      }
                      className="h-8 text-xs w-full min-w-50"
                    />
                  ) : (
                    <span className="block truncate max-w-50" title={m.artist}>
                      {m.artist}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  {m.id}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === m.id ? (
                      <>
                        <button
                          onClick={() => handleSave(m.id)}
                          className="p-1.5 text-[#1db954] hover:bg-[#1db954]/20 rounded transition-colors cursor-pointer"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Tooltip text="Modifier">
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pen size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Supprimer">
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                id: m.id,
                                title: m.title,
                              })
                            }
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
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

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: "", title: "" })}
        title="Supprimer le titre"
        message={`Retirer "${confirmDialog.title}" de la base de données ?`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default MusicsTab
