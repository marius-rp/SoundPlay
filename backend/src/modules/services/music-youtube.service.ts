import ytSearch from "yt-search"
import { exec } from "child_process"
import path from "path"
import { promisify } from "util"
import fs from "fs"
import NodeCache from "node-cache"
import { type Track } from "../types/Music"
import { proxyManager } from "../../utils/proxyManager.helper"
import { getSimilarity } from "../../utils/filterMusic.helper"
import { getRandomUserAgent, LINK_FILES_MUSICS } from "../../constant"
import { logger } from "../../utils/logger.helper"

const execPromise = promisify(exec)
const FILE_NAME = "music-youtube.service.ts"

const STORAGE_PATH = path.join(process.cwd(), LINK_FILES_MUSICS)
const PREVIEW_CACHE_PATH = path.join(process.cwd(), "cache_previews")

const BLOCK_DURATION = 60 * 60 * 1000
const RETRY_DELAY_MS = 60000
const DOWNLOAD_DELAY_MAX = 4000
const DOWNLOAD_DELAY_MIN = 2000

let isBlocked = false
let downloadQueue = Promise.resolve()

const cancelledDownloads = new Set<string>()

if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true })
}

if (!fs.existsSync(PREVIEW_CACHE_PATH)) {
  fs.mkdirSync(PREVIEW_CACHE_PATH, { recursive: true })
}

const searchCache = new NodeCache({ stdTTL: 7200, checkperiod: 600 })

export const musicYoutubeService = {
  search: async (
    query: string,
    userId: string | number = "SYSTEM",
  ): Promise<Track[]> => {
    const userQuery = query.toLowerCase().trim()

    const cachedResults = searchCache.get<Track[]>(userQuery)
    if (cachedResults) {
      logger(
        userId,
        FILE_NAME,
        "LOG",
        `Résultats récupérés du cache pour : "${userQuery}"`,
      )
      return cachedResults
    }

    const agent = proxyManager.getAgent()

    if (!agent) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Recherche bloquée : Aucun proxy disponible pour "${userQuery}"`,
      )
      throw new Error("NO_PROXY_AVAILABLE")
    }

    const queryParts = userQuery.split(/[-–—]/)
    const expectedArtist =
      queryParts.length > 1 ? queryParts[0].trim() : userQuery
    const expectedTitle =
      queryParts.length > 1 ? queryParts[1].trim() : userQuery

    try {
      const r: any = await (ytSearch as any)({
        query: userQuery,
        agent: agent,
      })

      const scoredTracks = (r.videos || []).map((v: any) => {
        const vTitle = v.title.toLowerCase()
        const vArtist = v.author.name.toLowerCase().replace(/ - topic$/g, "")

        const artistSim = getSimilarity(vArtist, expectedArtist)
        const titleSim = getSimilarity(vTitle, expectedTitle)
        const globalSim = getSimilarity(vArtist + " " + vTitle, userQuery)

        let rank = 7
        if (artistSim === 1 && titleSim === 1) rank = 1
        else if (artistSim >= 0.8 && titleSim >= 0.8) rank = 2
        else if (artistSim === 1 && globalSim >= 0.6) rank = 3
        else if (titleSim === 1 && globalSim >= 0.6) rank = 4
        else if (globalSim >= 0.5) rank = 5
        else if (globalSim >= 0.3) rank = 6

        let qualityBonus = 0
        if (vTitle.includes("audio") || vTitle.includes("official"))
          qualityBonus += 2
        if (vArtist.includes("topic")) qualityBonus += 3

        return {
          id: v.videoId,
          title: v.title.replace(/[\(\[][^)]*[\)\]]/gi, "").trim(),
          artist: v.author.name.replace(/ - topic$/g, ""),
          image: v.image || v.thumbnail || "",
          duration: v.timestamp,
          views: v.views || 0,
          rank: rank,
          quality: qualityBonus,
        }
      })

      let tracksToProcess = scoredTracks.filter((t: any) => t.rank < 7)

      if (tracksToProcess.length === 0 && scoredTracks.length > 0) {
        logger(
          userId,
          FILE_NAME,
          "INFO",
          `Aucun résultat strict (rank < 7) pour "${userQuery}". Utilisation des résultats larges.`,
        )
        tracksToProcess = scoredTracks
      }

      const finalTracks = tracksToProcess
        .sort((a: any, b: any) => {
          if (a.rank !== b.rank) return a.rank - b.rank
          if (a.rank === 7) return b.views - a.views
          if (a.quality !== b.quality) return b.quality - a.quality
          return b.views - a.views
        })
        .slice(0, 15)
        .map(({ rank, quality, ...rest }: any) => rest)

      searchCache.set(userQuery, finalTracks)
      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Recherche YouTube réussie (via Proxy) : "${userQuery}"`,
      )
      return finalTracks
    } catch (e: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Échec de la recherche YouTube : ${e.message}`,
      )
      throw new Error("SEARCH_FAILED")
    }
  },

  cancelDownload: (videoId: string, userId: string | number = "SYSTEM") => {
    cancelledDownloads.add(videoId)
    logger(
      userId,
      FILE_NAME,
      "WARN",
      `Demande d'annulation enregistrée pour : ${videoId}`,
    )
  },

  downloadTrack: async (
    videoId: string,
    userId: string | number = "SYSTEM",
  ): Promise<void> => {
    const filePath = path.resolve(STORAGE_PATH, `${videoId}.mp3`)
    if (fs.existsSync(filePath)) {
      logger(
        userId,
        FILE_NAME,
        "LOG",
        `Téléchargement ignoré : ${videoId} existe déjà`,
      )
      return
    }

    const task = downloadQueue.then(async () => {
      if (cancelledDownloads.has(videoId)) {
        cancelledDownloads.delete(videoId)
        logger(
          userId,
          FILE_NAME,
          "LOG",
          `Téléchargement annulé avant démarrage : ${videoId}`,
        )
        return
      }

      while (isBlocked) {
        logger(
          "SYSTEM",
          FILE_NAME,
          "WARN",
          `Téléchargement en attente (Service bloqué 429) : ${videoId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }

      if (cancelledDownloads.has(videoId)) {
        cancelledDownloads.delete(videoId)
        return
      }

      try {
        if (fs.existsSync(filePath)) return
        const randomUA = getRandomUserAgent()

        const cmd = `/app/yt-dlp \
          --limit-rate 1M \
          --no-part \
          --no-progress \
          --user-agent "${randomUA}" \
          -x --audio-format mp3 --audio-quality 128k \
          -o "${filePath}" \
          "https://www.youtube.com/watch?v=${videoId}"`

        logger(userId, FILE_NAME, "INFO", `Démarrage yt-dlp pour : ${videoId}`)
        await execPromise(cmd)

        logger(
          userId,
          FILE_NAME,
          "INFO",
          `Téléchargement terminé avec succès : ${videoId}`,
        )

        const randomDelay =
          Math.floor(Math.random() * DOWNLOAD_DELAY_MAX) + DOWNLOAD_DELAY_MIN
        await new Promise((resolve) => setTimeout(resolve, randomDelay))
      } catch (e: any) {
        if (e.message.includes("429")) {
          isBlocked = true
          logger(
            "SYSTEM",
            FILE_NAME,
            "ERROR",
            `YouTube Rate Limit (429) détecté. Blocage temporaire activé.`,
          )
          setTimeout(() => {
            isBlocked = false
          }, BLOCK_DURATION)
        }
        logger(
          userId,
          FILE_NAME,
          "ERROR",
          `Erreur lors du téléchargement yt-dlp (${videoId}) : ${e.message}`,
        )
        throw e
      }
    })

    downloadQueue = task.catch(() => {}) as Promise<void>
    return task
  },

  getPreviewPath: async (
    videoId: string,
    userId: string | number = "SYSTEM",
  ): Promise<string> => {
    const previewPath = path.resolve(PREVIEW_CACHE_PATH, `${videoId}.mp3`)
    if (fs.existsSync(previewPath)) return previewPath

    return new Promise(async (resolve, reject) => {
      try {
        const randomUA = getRandomUserAgent()

        const cmd = `/app/yt-dlp \
          --limit-rate 1M \
          --no-part \
          --user-agent "${randomUA}" \
          -x --audio-format mp3 --audio-quality 128k \
          --download-sections "*0-30" \
          -o "${previewPath}" \
          "https://www.youtube.com/watch?v=${videoId}"`

        logger(
          userId,
          FILE_NAME,
          "LOG",
          `Génération de la preview pour : ${videoId}`,
        )
        await execPromise(cmd)
        resolve(previewPath)
      } catch (e: any) {
        if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath)
        logger(
          userId,
          FILE_NAME,
          "ERROR",
          `Échec génération preview (${videoId}) : ${e.message}`,
        )
        reject(e)
      }
    })
  },

  clearSearchCache: (userId: string | number = "SYSTEM"): void => {
    searchCache.flushAll()
    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Cache de recherche réinitialisé manuellement.`,
    )
  },

  clearPreviewFiles: async (
    userId: string | number = "SYSTEM",
  ): Promise<void> => {
    try {
      if (fs.existsSync(PREVIEW_CACHE_PATH)) {
        const files = fs.readdirSync(PREVIEW_CACHE_PATH)
        let count = 0
        for (const file of files) {
          const filePath = path.join(PREVIEW_CACHE_PATH, file)
          if (file.endsWith(".mp3") || file.endsWith(".m4a")) {
            fs.unlinkSync(filePath)
            count++
          }
        }
        logger(
          userId,
          FILE_NAME,
          "INFO",
          `Nettoyage des fichiers de préécoute terminé (${count} fichiers supprimés).`,
        )
      }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur lors du nettoyage des fichiers de préécoute : ${error.message}`,
      )
    }
  },
}
