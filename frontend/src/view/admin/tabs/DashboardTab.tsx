import React, { useState, useEffect } from "react"
import {
  Users,
  Music,
  ListMusic,
  HardDrive,
  Activity,
  Trash2,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Download,
  Save,
  Plus,
  Loader2,
} from "lucide-react"
import { useToast } from "../../../context/ToastContext"
import { adminSystemService } from "../../../service/admin/admin-system.service"
import type { IAdminStats, IDownloadSetting } from "../../../interface/IAdmin"
import StatCard from "../../../components/cards/StatCard"
import Button from "../../../components/buttons/Button"
import { IconButton } from "../../../components/buttons/IconButton"
import { formatDateTime } from "../../../utils/date.helper"

const DashboardTab: React.FC = () => {
  const { showToast } = useToast()

  const [stats, setStats] = useState<IAdminStats | null>(null)
  const [downloadSettings, setDownloadSettings] = useState<IDownloadSetting[]>(
    [],
  )
  const [isFetching, setIsFetching] = useState(true)
  const [isLoadingAction, setIsLoadingAction] = useState(false)

  const [newFileName, setNewFileName] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [editedUrls, setEditedUrls] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const loadData = async () => {
      setIsFetching(true)
      try {
        const [resStats, resSettings] = await Promise.all([
          adminSystemService.getAllStats(),
          adminSystemService.getDownloadSettings(),
        ])
        if (resStats.success && resStats.data) setStats(resStats.data)
        if (resSettings.success && resSettings.data)
          setDownloadSettings(resSettings.data)
      } catch (error) {
        showToast("Erreur lors du chargement.", "error")
      } finally {
        setIsFetching(false)
      }
    }
    loadData()
  }, [])

  const handleUpdateYtdlp = async () => {
    setIsLoadingAction(true)
    try {
      showToast("Téléchargement en cours...", "success")
      const res = await adminSystemService.updateBinaries()
      if (res.success) {
        showToast("Les exécutables ont été mis à jour !", "success")
        const updated = await adminSystemService.getDownloadSettings()
        if (updated.data) setDownloadSettings(updated.data)
      } else showToast("Erreur.", "error")
    } catch (e) {
      showToast("Impossible de contacter le serveur.", "error")
    } finally {
      setIsLoadingAction(false)
    }
  }

  const handleClearCache = async () => {
    setIsLoadingAction(true)
    try {
      const res = await adminSystemService.clearSearchCache()
      if (res.success)
        showToast("Le cache des recherches a été réinitialisé.", "success")
    } catch (error) {
      showToast("Erreur.", "error")
    } finally {
      setIsLoadingAction(false)
    }
  }

  const handleClearPreviews = async () => {
    setIsLoadingAction(true)
    try {
      const res = await adminSystemService.clearPreviewCache()
      if (res.success)
        showToast("Les extraits audio ont été purgés.", "success")
    } catch (error) {
      showToast("Erreur.", "error")
    } finally {
      setIsLoadingAction(false)
    }
  }

  const handleUpdateDownloadSetting = async (fileName: string, url: string) => {
    setIsLoadingAction(true)
    try {
      const res = await adminSystemService.updateDownloadSetting(fileName, url)
      if (res.success) {
        showToast(`Source enregistrée.`, "success")
        const updated = await adminSystemService.getDownloadSettings()
        if (updated.data) setDownloadSettings(updated.data)
      } else showToast("Erreur de sauvegarde.", "error")
    } catch (error) {
      showToast("Erreur réseau.", "error")
    } finally {
      setIsLoadingAction(false)
    }
  }

  if (isFetching)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1db954]" />
      </div>
    )

  const total = stats?.totalProxies || 0
  const online = stats?.onlineProxies || 0
  const healthPercentage = total > 0 ? (online / total) * 100 : 0
  const isOperational = online > 0

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity size={20} className="text-[#1db954]" /> Statistiques de la
          plateforme
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Users size={24} />}
            title="Utilisateurs"
            value={stats?.totalUsers || 0}
          />
          <StatCard
            icon={<Music size={24} />}
            title="Musiques en base"
            value={stats?.totalMusics || 0}
          />
          <StatCard
            icon={<ListMusic size={24} />}
            title="Playlists"
            value={stats?.totalPlaylists || 0}
          />
          <StatCard
            icon={<HardDrive size={24} />}
            title="Stockage utilisé en musique"
            value={stats?.storageUsedMusics || "0 MB"}
          />
          <StatCard
            icon={<HardDrive size={24} />}
            title="Stockage utilisé en covers"
            value={stats?.storageUsedCovers || "0 MB"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-[#181818] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              <Globe size={18} className="text-[#1db954]" /> État des Proxys
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Analyse en temps réel de votre infrastructure.
            </p>
            <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Statut du réseau</span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isOperational ? "text-[#1db954]" : "text-red-500"}`}
                >
                  {isOperational ? (
                    <>
                      <ShieldCheck size={14} /> Opérationnel
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} /> Critique
                    </>
                  )}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${isOperational ? "bg-[#1db954] shadow-[0_0_8px_#1db954]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}
                  style={{ width: `${healthPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-gray-500">
                  {online} / {total} serveurs actifs
                </p>
                <p className="text-[10px] text-gray-400 font-bold">
                  {Math.round(healthPercentage)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" /> Nettoyage du système
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Libérez de l'espace et rafraîchissez les données temporaires.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg hover:border-white/10 border border-transparent transition-colors">
                <div>
                  <span className="text-sm font-medium text-white block">
                    Cache de recherche
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tight">
                    NodeCache • Mémoire vive
                  </span>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={isLoadingAction}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg hover:border-white/10 border border-transparent transition-colors">
                <div>
                  <span className="text-sm font-medium text-white block">
                    Fichiers de préécoute
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tight">
                    Stockage physique • .m4a / .mp3
                  </span>
                </div>
                <button
                  onClick={handleClearPreviews}
                  disabled={isLoadingAction}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              <Download size={18} className="text-blue-500" /> Sources des
              utilitaires
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Gérez les URLs distantes des outils système.
            </p>
            <div className="space-y-3 max-h-35 overflow-y-auto scrollbar-hide">
              {downloadSettings.map((setting) => (
                <div key={setting.fileName} className="flex items-center gap-2">
                  <div className="w-1/3 flex flex-col items-start justify-center gap-1">
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded truncate max-w-full">
                      {setting.fileName}
                    </span>
                    <span className="text-[9px] text-gray-500 pl-1">
                      {setting.lastUpdate
                        ? formatDateTime(setting.lastUpdate)
                        : "Non installé"}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="flex-1 bg-black/40 border border-white/5 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
                    value={editedUrls[setting.fileName] ?? setting.url}
                    onChange={(e) =>
                      setEditedUrls((prev) => ({
                        ...prev,
                        [setting.fileName]: e.target.value,
                      }))
                    }
                  />
                  <IconButton
                    icon={<Save size={14} />}
                    onClick={() =>
                      handleUpdateDownloadSetting(
                        setting.fileName,
                        editedUrls[setting.fileName] ?? setting.url,
                      )
                    }
                    disabled={isLoadingAction}
                    className="text-gray-500 hover:text-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-white/5">
              <input
                type="text"
                placeholder="fichier.exe"
                className="w-1/3 bg-black/40 border border-white/5 rounded px-2 py-1 text-xs text-white"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
              <input
                type="text"
                placeholder="https://..."
                className="flex-1 bg-black/40 border border-white/5 rounded px-2 py-1 text-xs text-white"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <IconButton
                icon={<Plus size={14} />}
                onClick={() => {
                  handleUpdateDownloadSetting(newFileName.trim(), newUrl.trim())
                  setNewFileName("")
                  setNewUrl("")
                }}
                disabled={isLoadingAction || !newFileName || !newUrl}
                className="text-blue-500 hover:bg-blue-500/10"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            shape="full"
            onClick={handleUpdateYtdlp}
            isLoading={isLoadingAction}
            className="mt-4 text-[11px] cursor-pointer"
          >
            Télécharger les mises à jour
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DashboardTab
