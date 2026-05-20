import type { IPlaylistTrack } from "../interface/playlistTrack"
import type { IPlayerTrack } from "../context/PlayerContext"

export const formatTracksForPlayer = (
  tracks: IPlaylistTrack[],
): IPlayerTrack[] => {
  if (!tracks || tracks.length === 0) return []

  return tracks.map((t) => ({
    id: t.id,
    title: t.title || "Titre inconnu",
    artist: t.artist || "Artiste inconnu",
    image: t.image || "",
    duration: t.duration,
  })) as IPlayerTrack[]
}
