import { Music } from "lucide-react"

export const EmptySearch: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
    <div className="bg-[#181818] p-8 rounded-full mb-6 text-gray-600">
      <Music size={64} />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
      Recherchez votre musique
    </h2>
    <p className="text-gray-400 text-center max-w-xs">
      Trouvez vos titres et artistes préférés.
    </p>
  </div>
)
