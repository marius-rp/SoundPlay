import React, { useEffect, useState, useRef } from "react"
import { Terminal, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { adminSystemService } from "../../../service/admin/admin-system.service"

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLPreElement>(null)

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminSystemService.getLogs()
      if (res.success && res.data) {
        setLogs(res.data)
      } else {
        setError("Impossible de charger les journaux.")
      }
    } catch (err) {
      setError("Erreur réseau lors de la récupération des logs.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const getLogStyle = (line: string) => {
    if (/\[ERROR\s*\]/i.test(line)) return "text-red-500 font-bold"
    if (/\[WARN\s*\]/i.test(line)) return "text-yellow-500 font-medium"
    if (/\[INFO\s*\]/i.test(line)) return "text-[#1db954] font-medium"
    if (/\[LOG\s*\]/i.test(line)) return "text-cyan-400"

    return "text-gray-400"
  }

  return (
    <div className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden flex flex-col h-125">
      <div className="bg-[#282828] px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Terminal size={18} className="text-[#1db954]" />
          Journaux du serveur (server.log)
        </div>
        <div className="flex items-center gap-4">
          {isLoading && (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          )}
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white disabled:opacity-50"
            title="Rafraîchir les logs"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#050505] overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-2">
            <AlertCircle size={24} />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <pre
            ref={scrollRef}
            className="h-full overflow-y-auto p-4 text-[11px] font-mono leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
          >
            {logs.split("\n").map((line, i) => {
              if (!line.trim()) return null

              const styleClass = getLogStyle(line)
              const isError = styleClass.includes("text-red-500")

              return (
                <div
                  key={i}
                  className={`${styleClass} whitespace-pre-wrap border-b border-white/2 py-0.5 hover:bg-white/5 transition-colors flex items-start`}
                >
                  {isError && (
                    <span className="inline-block min-w-1 h-4 bg-red-500 mr-3 mt-0.5 rounded-full" />
                  )}
                  <span className="flex-1">{line}</span>
                </div>
              )
            })}
            {!isLoading && logs.trim() === "" && (
              <div className="flex items-center justify-center h-full italic text-gray-600">
                Aucun log enregistré aujourd'hui.
              </div>
            )}
          </pre>
        )}
      </div>

      <div className="bg-[#181818] px-4 py-2 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
        <span>Format: [DATE] [LEVEL] [USER] [SOURCE]</span>
        <span>Rafraîchissement manuel</span>
      </div>
    </div>
  )
}

export default AdminLogs
