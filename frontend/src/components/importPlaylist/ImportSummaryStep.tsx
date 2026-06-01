import React from "react"
import { SkippedMusicItem } from "./SkippedMusicItem"

interface ImportSummaryStepProps {
  skippedMusics: any[]
  onClose: () => void
  onManualResolve: (index: number, url: string) => Promise<boolean>
}

export const ImportSummaryStep: React.FC<ImportSummaryStepProps> = ({
  skippedMusics,
  onClose,
  onManualResolve,
}) => {
  return (
    <div className="space-y-4">
      {skippedMusics.length > 0 ? (
        <>
          <p className="text-sm text-gray-400">
            Certains titres n'ont pas été trouvés. Cliquez sur une ligne pour
            coller manuellement l'URL ou l'ID de la vidéo YouTube.
          </p>
          <div className="max-h-87.5 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {skippedMusics.map((music, idx) => (
              <SkippedMusicItem
                key={`${music.title}-${idx}`}
                music={music}
                onResolve={(url) => onManualResolve(idx, url)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-[#1db954] font-medium py-4">
          Tous les titres ont été importés avec succès !
        </p>
      )}

      <div className="pt-2">
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-transparent border border-white/20 hover:border-white/50 text-white font-bold rounded-full transition-all transform active:scale-98 text-sm uppercase tracking-wider"
        >
          Terminer l'import
        </button>
      </div>
    </div>
  )
}
