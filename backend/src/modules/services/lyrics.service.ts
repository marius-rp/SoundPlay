import pool from "../config/db"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "lyrics.service.ts"
const LRCLIB_BASE_URL = "https://lrclib.net/api"

interface CleanedMetadata {
  artist: string
  track_name: string
}

function getMetadataFromRegex(
  trackName: string,
  artistName: string,
): CleanedMetadata[] {
  const candidates: CleanedMetadata[] = []

  const cleanInput = (str: string) =>
    str
      .replace(/\[.*?\]|\(.*?\)|".*?"|'.*?'/g, "")
      .replace(/\b(official|video|lyrics|audio|remix|live|hd|4k)\b/gi, "")
      .trim()

  const cleanTrack = cleanInput(trackName)
  const cleanArtist = cleanInput(artistName)

  candidates.push({ artist: artistName, track_name: trackName })

  candidates.push({ artist: cleanArtist, track_name: cleanTrack })

  if (cleanTrack.includes(" - ")) {
    const [a, ...t] = cleanTrack.split(" - ")
    candidates.push({ artist: a.trim(), track_name: t.join(" - ").trim() })
  }

  return candidates
}

export const lyricsService = {
  fetchLyrics: async (
    trackName: string,
    artistName: string,
    duration: number,
    userId: string | number = "SYSTEM",
  ): Promise<{ lyrics_lrc: string | null; provider: string } | null> => {
    const candidates = getMetadataFromRegex(trackName, artistName)

    for (const metadata of candidates) {
      if (!metadata.track_name) continue

      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Lancement requête LRCLIB pour : ${metadata.artist} - ${metadata.track_name}`,
      )

      try {
        const searchParams = new URLSearchParams({
          track_name: metadata.track_name.trim(),
          artist_name: metadata.artist.trim(),
        })

        const url = `${LRCLIB_BASE_URL}/search?${searchParams.toString()}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        logger(
          userId,
          FILE_NAME,
          "INFO",
          `Réponse reçue (Status: ${res.status}) pour : ${metadata.track_name}`,
        )

        if (!res.ok) {
          logger(userId, FILE_NAME, "INFO", `LRCLIB erreur HTTP: ${res.status}`)
          continue
        }

        const results = await res.json()

        if (!Array.isArray(results) || results.length === 0) {
          logger(
            userId,
            FILE_NAME,
            "INFO",
            `La requête LRCLIB n'a retourné aucun résultat pour : ${metadata.artist} - ${metadata.track_name}`,
          )
          continue
        }

        return {
          lyrics_lrc: results[0].syncedLyrics || results[0].plainLyrics,
          provider: "lrclib",
        }
      } catch (err) {
        logger(userId, FILE_NAME, "ERROR", `Erreur réseau LRCLIB: ${err}`)
      }
    }

    return null
  },

  saveLyrics: async (
    musicId: string,
    lyricsLrc: string,
    provider: string = "lrclib",
    userId: string | number = "SYSTEM",
  ): Promise<boolean> => {
    try {
      await pool.query(
        `INSERT INTO lyrics (music_id, lyrics_lrc, provider)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE lyrics_lrc = ?, provider = ?, updated_at = CURRENT_TIMESTAMP`,
        [musicId, lyricsLrc, provider, lyricsLrc, provider],
      )
      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Paroles sauvegardées en BDD pour music_id: ${musicId}`,
      )
      return true
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur saveLyrics (${musicId}): ${error.message}`,
      )
      return false
    }
  },

  getLyricsByMusicId: async (
    musicId: string,
  ): Promise<{ lyrics_lrc: string; provider: string } | null> => {
    try {
      const [rows]: any = await pool.query(
        `SELECT lyrics_lrc, provider FROM lyrics WHERE music_id = ? LIMIT 1`,
        [musicId],
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getLyricsByMusicId (${musicId}): ${error.message}`,
      )
      return null
    }
  },

  fetchAndStoreLyrics: async (
    musicId: string,
    trackName: string,
    artistName: string,
    duration: number,
    userId: string | number = "SYSTEM",
  ): Promise<void> => {
    try {
      const existing = await lyricsService.getLyricsByMusicId(musicId)
      if (existing) return

      const result = await lyricsService.fetchLyrics(
        trackName,
        artistName,
        duration,
        userId,
      )

      if (result && result.lyrics_lrc) {
        await lyricsService.saveLyrics(
          musicId,
          result.lyrics_lrc,
          result.provider,
          userId,
        )
      }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Échec fetchAndStoreLyrics pour ${musicId}: ${error.message}`,
      )
    }
  },
}
