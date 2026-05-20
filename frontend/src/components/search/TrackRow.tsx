import React from "react"
import { Clock3, Square, Loader2, Plus } from "lucide-react"
import { type ITrack } from "../../interface/IMusic"
import { IconButton } from "../buttons/IconButton"

interface TrackRowProps {
  track: ITrack
  onPreview: (track: ITrack) => void
  isPreviewing: boolean
  isLoadingPreview?: boolean
  onAddPlaylist: (track: ITrack) => void
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  onPreview,
  isPreviewing,
  isLoadingPreview,
  onAddPlaylist,
}) => (
  <div className="group flex items-center gap-4 p-3 rounded-md hover:bg-white/5 transition-colors border-b border-white/5 last:border-none">
    <div className="w-8 flex items-center justify-center shrink-0">
      <IconButton
        icon={<Plus size={18} />}
        onClick={(e) => {
          e.stopPropagation()
          onAddPlaylist(track)
        }}
        title="Ajouter à une playlist"
        className="opacity-0 group-hover:opacity-100 text-white hover:text-[#1db954] hover:bg-transparent transition-opacity"
      />
    </div>

    <div className="flex items-center gap-4 flex-1 min-w-0">
      <img
        src={track.image}
        alt="cover"
        onClick={() => onPreview(track)}
        className="w-12 h-12 rounded-md object-cover shrink-0 shadow-md cursor-pointer hover:opacity-80 transition-opacity hover:border-4 hover:border-[#1db954]"
      />

      <div className="flex flex-col flex-1 min-w-0">
        <h3
          onClick={() => onPreview(track)}
          className={`font-semibold text-base truncate transition-colors cursor-pointer inline-block max-w-fit ${
            isPreviewing
              ? "text-[#1db954]"
              : "text-white hover:text-[#1db954] hover:underline"
          }`}
        >
          {track.title}
        </h3>
        <p className="text-gray-400 text-sm truncate cursor-default">
          {track.artist}
        </p>
      </div>
    </div>

    <div className="w-10 flex items-center justify-center shrink-0">
      {(isLoadingPreview || isPreviewing) && (
        <IconButton
          icon={
            isLoadingPreview ? (
              <Loader2 size={18} className="animate-spin text-[#1db954]" />
            ) : (
              <Square size={16} fill="black" />
            )
          }
          onClick={(e) => {
            e.stopPropagation()
            onPreview(track)
          }}
          disabled={isLoadingPreview}
          className={`hover:scale-105 transition-all ${
            isPreviewing
              ? "bg-[#1db954] text-black hover:bg-[#1ed760] hover:text-black"
              : "hover:bg-transparent"
          }`}
        />
      )}
    </div>

    <div className="flex items-center gap-2 text-gray-500 text-sm tabular-nums shrink-0 pr-2">
      <Clock3 size={16} className="opacity-60" />
      {track.duration}
    </div>
  </div>
)
