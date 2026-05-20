import React, { useState } from "react"
import {
  Users,
  Music,
  ListMusic,
  Server,
  Activity,
  Globe,
  Terminal,
} from "lucide-react"
import TabButton from "../../components/ui/TabButton"

import DashboardTab from "./tabs/DashboardTab"
import UsersTab from "./tabs/UsersTab"
import MusicsTab from "./tabs/MusicsTab"
import PlaylistsTab from "./tabs/PlaylistsTab"
import ProxiesTab from "./tabs/ProxiesTab"
import LogsTab from "./tabs/LogsTab"

type TabType =
  | "dashboard"
  | "users"
  | "musics"
  | "playlists"
  | "proxies"
  | "logs"

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")

  return (
    <div className="h-full bg-[#121212] overflow-y-auto pb-32 scrollbar-hide">
      <header className="sticky top-0 z-30 bg-[#121212]/90 backdrop-blur-xl px-4 md:px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Server className="text-[#1db954]" size={28} />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Panneau d'Administration
          </h1>
        </div>
        <div className="flex gap-6 mt-6 border-b border-white/10 overflow-x-auto scrollbar-hide">
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={<Activity size={16} />}
            label="Vue d'ensemble"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={<Users size={16} />}
            label="Utilisateurs"
          />
          <TabButton
            active={activeTab === "musics"}
            onClick={() => setActiveTab("musics")}
            icon={<Music size={16} />}
            label="Musiques"
          />
          <TabButton
            active={activeTab === "playlists"}
            onClick={() => setActiveTab("playlists")}
            icon={<ListMusic size={16} />}
            label="Playlists"
          />
          <TabButton
            active={activeTab === "proxies"}
            onClick={() => setActiveTab("proxies")}
            icon={<Globe size={16} />}
            label="Proxys"
          />
          <TabButton
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
            icon={<Terminal size={16} />}
            label="Logs"
          />
        </div>
      </header>

      <main className="px-4 md:px-8 py-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "musics" && <MusicsTab />}
        {activeTab === "playlists" && <PlaylistsTab />}
        {activeTab === "proxies" && <ProxiesTab />}
        {activeTab === "logs" && <LogsTab />}
      </main>
    </div>
  )
}

export default Admin
