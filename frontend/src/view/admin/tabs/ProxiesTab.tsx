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
} from "lucide-react"
import { useToast } from "../../../context/ToastContext"
import { type IProxy } from "../../../interface/IProxy"
import SearchBar from "../../../components/dropdown/SearchBar"
import Button from "../../../components/buttons/Button"
import { IconButton } from "../../../components/buttons/IconButton"
import ProxyFormModal from "../../../components/modal/ProxyFormModal"
import ConfirmModal from "../../../components/modal/ConfirmModal"
import { adminProxyService } from "../../../service/admin/admin-proxy.service"

const ProxiesTab: React.FC = () => {
  const { showToast } = useToast()

  const [proxies, setProxies] = useState<IProxy[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        showToast("Erreur.", "error")
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

  const handleAddProxy = async (proxyData: Partial<IProxy>) => {
    setIsLoading(true)
    try {
      const res = await adminProxyService.addProxy(proxyData)
      if (res.success) {
        showToast("Proxy ajouté.", "success")
        const updated = await adminProxyService.getAllProxies()
        if (updated.data) setProxies(updated.data)
      }
    } catch (e) {
      showToast("Erreur.", "error")
    } finally {
      setIsLoading(false)
      setIsModalOpen(false)
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
      showToast("Erreur.", "error")
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
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap w-full sm:w-auto"
        >
          <Plus size={18} /> Nouveau Proxy
        </Button>
      </div>

      <div className="bg-[#181818] rounded-xl border border-white/5 overflow-x-auto">
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
                    disabled={isLoading}
                  />
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
                    disabled={isLoading || testingId === p.id}
                  />
                  <IconButton
                    icon={<Trash2 size={18} className="text-red-500" />}
                    onClick={() =>
                      setConfirmDialog({ isOpen: true, id: p.id, host: p.host })
                    }
                    disabled={isLoading}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProxyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddProxy}
        isLoading={isLoading}
      />
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
