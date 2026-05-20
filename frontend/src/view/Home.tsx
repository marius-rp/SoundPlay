import React from "react"
import { Play } from "lucide-react"

const Home: React.FC = () => {
  const playlists = [
    { id: 1, title: "Découvertes de la semaine" },
    { id: 2, title: "Mix Enfant des années 80" },
    { id: 3, title: "Daily Mix 1" },
    { id: 4, title: "Chill & Lo-Fi" },
    { id: 5, title: "Top 50 France" },
    { id: 6, title: "Rock Classics" },
  ]

  return (
    <div className="min-h-full bg-linear-to-b from-[#222222] to-[#121212] pb-24">
      <header className="sticky top-0 z-10 p-6 flex justify-between items-center bg-[#121212]/40 backdrop-blur-md transition-all">
        <div className="flex space-x-4">
          <button className="w-8 h-8 flex items-center justify-center bg-black/60 rounded-full hover:bg-black/80 transition">
            <span className="text-gray-300">{"<"}</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-black/60 rounded-full hover:bg-black/80 transition">
            <span className="text-gray-300">{">"}</span>
          </button>
        </div>
      </header>

      <section className="px-4 md:px-8 pt-2">
        <h1 className="text-3xl font-black mb-6 tracking-tight">Bonjour</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="flex items-center bg-white/5 hover:bg-white/10 transition-colors rounded-md overflow-hidden cursor-pointer group relative shadow-lg"
            >
              <div className="w-20 h-20 bg-linear-to-br from-gray-700 to-gray-900 shrink-0 shadow-2xl"></div>
              <div className="flex-1 px-4">
                <span className="font-bold text-sm lg:text-base line-clamp-2">
                  {pl.title}
                </span>
              </div>

              <button className="mr-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-[#1ed760] text-black p-3 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95">
                <Play fill="black" size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold tracking-tight hover:underline cursor-pointer">
              Écoutés récemment
            </h2>
            <button className="text-gray-400 text-xs font-bold hover:underline tracking-widest uppercase">
              Tout afficher
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all duration-300 group cursor-pointer shadow-md"
              >
                <div className="relative mb-4">
                  <div className="aspect-square bg-[#333] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"></div>
                  <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-[#1ed760] text-black p-3 rounded-full shadow-xl hover:scale-105">
                    <Play fill="black" size={18} />
                  </button>
                </div>
                <h3 className="font-bold text-sm mb-1 truncate">
                  Daily Mix {i}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  Basé sur vos écoutes récentes de musique.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
