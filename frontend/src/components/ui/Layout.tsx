import React, { useEffect, useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  Home as HomeIcon,
  Search,
  Library,
  PlusSquare,
  Heart,
  LogOut,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  X as XIcon,
  ShieldUser,
} from "lucide-react"
import { useUser } from "../../hooks/useUser"
import { useAuth } from "../../protection/AuthContext"
import { useDownload } from "../../context/DownloadContext"
import PlayerBar from "../player/PlayerBar"
import { usePlayer } from "../../context/PlayerContext"

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { fullName, isSupervisor, isAdmin } = useUser()
  const { logoutUser } = useAuth()

  const { activeDownloads, cancelDownload } = useDownload()
  const { currentTrack } = usePlayer()
  const [isDownloadsExpanded, setIsDownloadsExpanded] = useState(false)

  const isActive = (path: string) => location.pathname.includes(path)

  useEffect(() => {
    const el = document.getElementById("main-container")
    if (el) el.scrollTop = 0
  }, [location.pathname])

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">
      {activeDownloads.length > 0 && (
        <div
          onClick={() => setIsDownloadsExpanded(!isDownloadsExpanded)}
          className={`md:hidden fixed right-4 bg-[#282828] text-white px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col gap-3 z-100 min-w-55 animate-in fade-in slide-in-from-bottom-5 duration-300 border border-white/10 cursor-pointer ${currentTrack ? "bottom-40" : "bottom-20"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#1db954]" />
              <span className="text-xs font-semibold tracking-wide">
                {activeDownloads.length} ajout
                {activeDownloads.length > 1 ? "s" : ""}
              </span>
            </div>
            {isDownloadsExpanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronUp size={16} className="text-gray-400" />
            )}
          </div>

          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-[#1db954] w-full rounded-full animate-pulse shadow-[0_0_10px_#1db954]"></div>
          </div>

          {isDownloadsExpanded && (
            <div className="mt-1 border-t border-white/10 pt-3 flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-hide">
              {activeDownloads.map((dl, index) => (
                <div
                  key={dl.id}
                  className={`flex items-center justify-between bg-white/5 px-3 py-2 rounded-md shrink-0 ${index === 0 ? "border border-[#1db954]/30" : ""}`}
                >
                  <div className="flex flex-col text-xs overflow-hidden pr-2">
                    <span className="font-medium text-white truncate">
                      {dl.title}
                    </span>
                    <span className="text-gray-400 text-[10px] truncate mt-0.5">
                      vers {dl.playlistName}
                    </span>
                    {index === 0 && (
                      <span className="text-[#1db954] text-[9px] mt-0.5 font-semibold">
                        Ajout en cours...
                      </span>
                    )}
                  </div>

                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        cancelDownload(dl.id)
                      }}
                      className="text-gray-500 hover:text-red-500 transition-colors p-1"
                      title="Annuler"
                    >
                      <XIcon size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex w-64 bg-black flex-col p-6 border-r border-white/5 shrink-0">
          <div
            onClick={() => navigate("/home")}
            className="text-2xl font-black tracking-tighter text-[#1ed760] cursor-pointer mb-8"
          >
            SoundPlay<span className="text-white">.</span>
          </div>

          <nav className="space-y-4">
            <div
              onClick={() => navigate("/home")}
              className={`flex items-center space-x-4 cursor-pointer transition group ${isActive("/home") ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
              <HomeIcon size={24} />
              <span className="font-bold">Accueil</span>
            </div>
            <div
              onClick={() => navigate("/search")}
              className={`flex items-center space-x-4 cursor-pointer transition group ${isActive("/search") ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Search size={24} />
              <span className="font-bold">Recherche</span>
            </div>
            <div
              onClick={() => navigate("/library")}
              className="flex items-center space-x-4 text-gray-400 hover:text-white cursor-pointer transition group"
            >
              <Library size={24} />
              <span className="font-bold">Bibliothèque</span>
            </div>
          </nav>

          <div className="pt-8 space-y-4">
            <div className="flex items-center space-x-4 text-gray-400 hover:text-white cursor-pointer transition group">
              <div className="bg-gray-400 p-1 rounded-sm text-black group-hover:bg-white transition">
                <PlusSquare size={16} />
              </div>
              <span className="font-bold text-sm">Créer une playlist</span>
            </div>
            <div className="flex items-center space-x-4 text-gray-400 hover:text-white cursor-pointer transition group">
              <div className="bg-linear-to-br from-indigo-700 to-blue-300 p-1 rounded-sm text-white">
                <Heart size={16} fill="white" />
              </div>
              <span className="font-bold text-sm">Titres likés</span>
            </div>
          </div>

          {(isSupervisor || isAdmin) && (
            <div className="pt-8 space-y-4">
              <div
                onClick={() => navigate("/Admin")}
                className="flex items-center space-x-4 text-gray-400 hover:text-white cursor-pointer transition group"
              >
                <ShieldUser size={24} />
                <span className="font-bold">Administration</span>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
            {activeDownloads.length > 0 && (
              <div
                onClick={() => setIsDownloadsExpanded(!isDownloadsExpanded)}
                className="bg-[#181818] p-3 rounded-lg border border-white/5 animate-in fade-in slide-in-from-bottom-2 cursor-pointer hover:bg-[#202020] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1db954]" />
                    <span className="text-xs font-semibold text-gray-300">
                      {activeDownloads.length} ajout
                      {activeDownloads.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {isDownloadsExpanded ? (
                    <ChevronDown size={14} className="text-gray-500" />
                  ) : (
                    <ChevronUp size={14} className="text-gray-500" />
                  )}
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-[#1db954] w-full rounded-full animate-pulse shadow-[0_0_8px_#1db954]"></div>
                </div>

                {isDownloadsExpanded && (
                  <div className="mt-3 border-t border-white/5 pt-3 flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {activeDownloads.map((dl, index) => (
                      <div
                        key={dl.id}
                        className={`flex items-center justify-between bg-white/5 px-2 py-2 rounded-md shrink-0 ${index === 0 ? "border border-[#1db954]/30" : ""}`}
                      >
                        <div className="flex flex-col text-xs overflow-hidden pr-2">
                          <span className="text-white truncate font-medium">
                            {dl.title}
                          </span>
                          <span className="text-gray-500 text-[10px] truncate mt-0.5">
                            vers {dl.playlistName}
                          </span>
                          {index === 0 && (
                            <span className="text-[#1db954] text-[9px] mt-0.5 font-semibold">
                              Ajout en cours...
                            </span>
                          )}
                        </div>

                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelDownload(dl.id)
                            }}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1"
                            title="Annuler"
                          >
                            <XIcon size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <div className="flex items-center space-x-3 overflow-hidden border-2 border-transparent hover:border-gray-800 rounded-full p-1 transition-all">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-lg">
                  {fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold tracking-wide truncate">
                  {fullName}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  logoutUser()
                }}
                className="text-gray-500 hover:text-red-500 transition-colors p-2"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        <main
          id="main-container"
          className="flex-1 overflow-y-auto bg-[#121212] relative"
        >
          <Outlet />
        </main>
      </div>
      <PlayerBar />

      <nav className="md:hidden w-full shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-2 py-3 z-50 pb-safe">
        <div
          onClick={() => navigate("/home")}
          className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/home") ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <HomeIcon size={24} />
          <span className="text-[10px] font-medium mt-1">Accueil</span>
        </div>
        <div
          onClick={() => navigate("/search")}
          className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/search") ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <Search size={24} />
          <span className="text-[10px] font-medium mt-1">Recherche</span>
        </div>
        <div
          onClick={() => navigate("/library")}
          className="flex flex-col items-center text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <Library size={24} />
          <span className="text-[10px] font-medium mt-1">Bibliothèque</span>
        </div>
        <div
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/profile") ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <User size={24} />
          <span className="text-[10px] font-medium mt-1">Profil</span>
        </div>

        {/* ← Ajout Admin */}
        {(isAdmin || isSupervisor) && (
          <div
            onClick={() => navigate("/Admin")}
            className={`flex flex-col items-center cursor-pointer transition-colors ${isActive("/Admin") ? "text-white" : "text-gray-400 hover:text-white"}`}
          >
            <ShieldUser size={24} />
            <span className="text-[10px] font-medium mt-1">Admin</span>
          </div>
        )}
      </nav>
    </div>
  )
}

export default Layout
