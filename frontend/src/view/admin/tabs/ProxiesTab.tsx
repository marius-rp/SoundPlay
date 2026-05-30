import React, { useState, useEffect, useMemo } from "react"
import {
  Trash2,
  Plus,
  ShieldCheck,
  RefreshCw,
  ShieldAlert,
  ZapOff,
  Power,
  Loader2,
  UploadCloud,
  X,
  Download,
  Pencil,
} from "lucide-react"
import { useToast } from "../../../context/ToastContext"
import { type IProxy } from "../../../interface/IProxy"
import SearchBar from "../../../components/dropdown/SearchBar"
import Button from "../../../components/buttons/Button"
import { IconButton } from "../../../components/buttons/IconButton"
import ProxyFormModal from "../../../components/modal/ProxyFormModal"
import ConfirmModal from "../../../components/modal/ConfirmModal"
import { adminProxyService } from "../../../service/admin/admin-proxy.service"
import { FileUploadZone } from "../../../components/dropdown/FileUploadZone"
import Modal from "../../../components/modal/Modal"
import Tooltip from "../../../components/ui/Tooltip"

const ProxiesTab: React.FC = () => {
  const { showToast } = useToast()

  const [proxies, setProxies] = useState<IProxy[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingAll, setIsTestingAll] = useState(false)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProxy, setEditingProxy] = useState<IProxy | null>(null)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: 0,
    host: "",
  })

  useEffect(() => {
    const loadProxies = async () => {
      try {
        const res = await adminProxyService.getAllProxies()
        if (res.success && res.data) setProxies(res.data)
      } catch (error) {
        showToast("Erreur lors de la récupération des proxys.", "error")
      } finally {
        setIsFetching(false)
      }
    }
    loadProxies()
  }, [])

  const filteredProxies = useMemo(() => {
    if (!search.trim()) return proxies
    return proxies.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.host.toLowerCase().includes(search.toLowerCase()),
    )
  }, [proxies, search])

  const handleCsvUpload = async (file: File) => {
    const res = await adminProxyService.uploadProxyCsv(file)

    if (res.success) {
      showToast("Liste de proxys synchronisée avec succès.", "success")

      const updated = await adminProxyService.getAllProxies()
      if (updated.data) setProxies(updated.data)

      setTimeout(() => {
        setIsBulkOpen(false)
      }, 1600)
    } else {
      throw new Error(
        res.error?.message || "Échec de l'importation du fichier CSV.",
      )
    }
  }

  const downloadTemplateCsv = () => {
    const headers = "IP,PORT,USERNAME,PASSWORD,URL\n"
    const exampleRow =
      "192.168.1.1,8080,mon_user,mon_password,https://provider.io/dashboard\n"
    const csvContent = headers + exampleRow

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.setAttribute("href", url)
    link.setAttribute("download", "template_imports_proxies.csv")
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveProxy = async (proxyData: Partial<IProxy>) => {
    setIsLoading(true)
    try {
      if (editingProxy) {
        const res = await adminProxyService.updateProxy(
          editingProxy.id,
          proxyData,
        )
        if (res.success) {
          showToast("Proxy modifié avec succès.", "success")
          const updated = await adminProxyService.getAllProxies()
          if (updated.data) setProxies(updated.data)
        }
      } else {
        const res = await adminProxyService.addProxy(proxyData)
        if (res.success) {
          showToast("Proxy ajouté.", "success")
          const updated = await adminProxyService.getAllProxies()
          if (updated.data) setProxies(updated.data)
        }
      }
    } catch (e) {
      showToast("Erreur lors de l'enregistrement.", "error")
    } finally {
      setIsLoading(false)
      setIsModalOpen(false)
      setEditingProxy(null)
    }
  }

  const handleEditClick = (proxy: IProxy) => {
    setEditingProxy(proxy)
    setIsModalOpen(true)
  }

  const handleTestAllProxies = async () => {
    if (proxies.length === 0) return
    setIsTestingAll(true)
    showToast("Vérification globale de vos serveurs en cours...", "info")

    try {
      const res = await adminProxyService.testAllProxies()
      if (res.success && res.data) {
        const { online, total, rateLimited } = res.data
        showToast(
          `Vérification finie : ${online}/${total} opérationnels (${rateLimited} saturés).`,
          online > 0 ? "success" : "error",
        )
        const updated = await adminProxyService.getAllProxies()
        if (updated.data) setProxies(updated.data)
      } else {
        showToast(
          res.error?.message || "Erreur lors du traitement global.",
          "error",
        )
      }
    } catch (error) {
      showToast("Le serveur distant ne répond pas.", "error")
    } finally {
      setIsTestingAll(false)
    }
  }

  const handleTestClick = async (id: number) => {
    setTestingId(id)
    try {
      const res = await adminProxyService.testProxy(id)
      const isOnline = res.success && res.data?.status === "online"
      showToast(
        `Proxy ${isOnline ? "opérationnel" : "hors-ligne"}.`,
        isOnline ? "success" : "error",
      )
      if (res.data)
        setProxies((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, last_status: res.data!.status as any } : p,
          ),
        )
    } catch (e) {
      showToast("Erreur lors du test.", "error")
    }
    setTestingId(null)
  }

  const handleToggleProxy = async (id: number, isActive: boolean) => {
    setProxies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
    )
    try {
      await adminProxyService.toggleProxy(id, isActive)
    } catch (e) {
      showToast("Erreur réseau.", "error")
      const updated = await adminProxyService.getAllProxies()
      if (updated.data) setProxies(updated.data)
    }
  }

  const confirmDelete = async () => {
    try {
      const res = await adminProxyService.deleteProxy(confirmDialog.id)
      if (res.success) {
        showToast("Proxy retiré.", "success")
        setProxies((prev) => prev.filter((p) => p.id !== confirmDialog.id))
      }
    } catch (e) {
      showToast("Erreur.", "error")
    }
    setConfirmDialog({ isOpen: false, id: 0, host: "" })
  }

  if (isFetching)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1db954]" />
      </div>
    )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <SearchBar
          placeholder="Filtrer vos proxys..."
          value={search}
          onChange={setSearch}
          className="w-full sm:max-w-md"
        />
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            disabled={isTestingAll || proxies.length === 0}
            onClick={handleTestAllProxies}
            className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-full transition-all border duration-200 bg-white text-black border-transparent hover:scale-102 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              size={15}
              className={isTestingAll ? "animate-spin" : ""}
            />
            {isTestingAll ? "Analyse..." : "Tester tout"}
          </Button>

          <Button
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-full transition-all border duration-200 cursor-pointer ${
              isBulkOpen
                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                : "bg-white/5 text-white border-white/10 hover:text-black"
            }`}
          >
            {isBulkOpen ? <X size={18} /> : <UploadCloud size={18} />}
            {isBulkOpen ? "Annuler l'import" : "Importer un CSV"}
          </Button>

          <Button
            onClick={() => {
              setEditingProxy(null)
              setIsModalOpen(true)
            }}
            className="flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto cursor-pointer"
          >
            <Plus size={18} /> Nouveau Proxy
          </Button>
        </div>
      </div>

      <div className="bg-[#181818] rounded-xl border border-white/5 overflow-x-auto relative">
        {isTestingAll && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl animate-in fade-in duration-200">
            <div className="bg-[#282828] px-6 py-4 rounded-xl border border-white/10 flex items-center gap-4 shadow-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-[#1db954]" />
              <span className="text-sm font-bold text-white">
                Analyse des connexions en arrière-plan...
              </span>
            </div>
          </div>
        )}

        <table className="w-full text-left text-sm text-gray-300 min-w-175">
          <thead className="bg-[#282828] text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-[10px]">
                Proxy
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px]">
                Serveur
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px]">
                Statut
              </th>
              <th className="px-6 py-4 font-medium uppercase text-[10px] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredProxies.map((p) => (
              <tr
                key={p.id}
                className={`transition-colors group ${p.is_active ? "hover:bg-white/5" : "bg-black/40 opacity-50 hover:opacity-100"}`}
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-white group-hover:text-[#1db954] flex items-center gap-2">
                    {p.name}{" "}
                    {!p.is_active && (
                      <span className="text-[9px] uppercase bg-gray-800 px-1.5 py-0.5 rounded">
                        En pause
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    ID: #{p.id}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">
                  {p.host}:{p.port}
                </td>
                <td className="px-6 py-4">
                  {p.last_status === "online" && (
                    <div className="flex items-center gap-2 text-[#1db954]">
                      <ShieldCheck size={14} />
                      <span className="text-xs font-bold uppercase">
                        Opérationnel
                      </span>
                    </div>
                  )}
                  {p.last_status === "rate-limited" && (
                    <div className="flex items-center gap-2 text-orange-500">
                      <ZapOff size={14} />
                      <span className="text-xs font-bold uppercase">
                        Saturé
                      </span>
                    </div>
                  )}
                  {p.last_status === "offline" && (
                    <div className="flex items-center gap-2 text-red-500">
                      <ShieldAlert size={14} />
                      <span className="text-xs font-bold uppercase">Échec</span>
                    </div>
                  )}
                  {p.last_status === "untested" && (
                    <span className="text-xs text-gray-500 italic">
                      Non testé
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-1">
                  <Tooltip
                    text={
                      p.is_active ? "Désactiver le proxy" : "Activer le proxy"
                    }
                  >
                    <IconButton
                      icon={
                        <Power
                          size={16}
                          className={
                            p.is_active ? "text-[#1db954]" : "text-gray-500"
                          }
                        />
                      }
                      onClick={() => handleToggleProxy(p.id, !p.is_active)}
                      disabled={isLoading || isTestingAll}
                    />
                  </Tooltip>
                  <Tooltip text="Modifier le proxy">
                    <IconButton
                      icon={
                        <Pencil
                          size={15}
                          className="text-gray-400 hover:text-white transition-colors"
                        />
                      }
                      onClick={() => handleEditClick(p)}
                      disabled={isLoading || isTestingAll}
                    />
                  </Tooltip>
                  <Tooltip text="Tester le proxy">
                    <IconButton
                      icon={
                        <RefreshCw
                          size={16}
                          className={
                            testingId === p.id
                              ? "animate-spin text-[#1db954]"
                              : ""
                          }
                        />
                      }
                      onClick={() => handleTestClick(p.id)}
                      disabled={isLoading || testingId === p.id || isTestingAll}
                    />
                  </Tooltip>
                  <Tooltip text="Supprimer le proxy">
                    <IconButton
                      icon={<Trash2 size={18} className="text-red-500" />}
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          id: p.id,
                          host: p.host,
                        })
                      }
                      disabled={isLoading || isTestingAll}
                    />
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProxyFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProxy(null)
        }}
        onAdd={handleSaveProxy}
        isLoading={isLoading}
        proxyToEdit={editingProxy}
      />

      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Importer une liste de proxys (.csv)"
      >
        <div className="w-full py-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
            <div>
              <p className="text-xs font-bold text-white">
                Structure requise du fichier
              </p>
              <p className="text-[11px] text-gray-400">
                Téléchargez le modèle contenant les en-têtes indispensables.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplateCsv}
              className="flex items-center gap-2 text-xs font-bold text-[#1db954] hover:text-[#1ed760] transition-colors bg-[#1db954]/10 hover:bg-[#1db954]/20 px-3 py-1.5 rounded-full border border-[#1db954]/20 whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <Download size={14} />
              Télécharger le template
            </button>
          </div>

          <FileUploadZone
            acceptedTypes={["text/csv", "application/vnd.ms-excel", ".csv"]}
            maxSizeInMB={5}
            onUpload={handleCsvUpload}
            title="Glissez votre fichier CSV ici"
            subtitle="Format attendu : IP, PORT, USERNAME, PASSWORD, URL"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: 0, host: "" })}
        title="Supprimer le proxy"
        message={`Retirer le proxy ${confirmDialog.host} ?`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default ProxiesTab
