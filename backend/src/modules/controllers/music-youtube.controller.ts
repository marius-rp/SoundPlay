import { Request, Response } from "express"
import { musicYoutubeService } from "../services/music-youtube.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { searchHistoryService } from "../services/search-history.service"
import { musicService } from "../services/music.service"
import { Track } from "../types/Music"
import ytSearch from "yt-search"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "music-youtube.controller.ts"

export const searchMusic = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const query = (req.query.q as string)?.trim().toLowerCase()
    if (!query || query.length < 2) {
      return errorResponse(res, 400, "Recherche trop courte")
    }

    const tracks = await musicYoutubeService.search(query)
    logger(userId, FILE_NAME, "INFO", `Recherche effectuée : "${query}"`)
    await searchHistoryService.saveSearch(userId, query)

    return successResponse(res, 200, tracks)
  } catch (error: any) {
    if (error.message === "NO_PROXY_AVAILABLE") {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Recherche avortée (Proxy indisponible) pour : "${req.query.q}"`,
      )
      return errorResponse(
        res,
        503,
        "Le service de recherche est momentanément indisponible (Maintenance réseau).",
      )
    }

    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la recherche")
  }
}

export const downloadMusic = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const { id } = req.params
    if (!id) return errorResponse(res, 400, "ID manquant")

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Lancement du téléchargement pour la vidéo : ${id}`,
    )
    await musicYoutubeService.downloadTrack(id as string)

    try {
      const videoInfo = await ytSearch({ videoId: id as string })
      if (videoInfo) {
        const trackData: Track = {
          id: videoInfo.videoId,
          title: videoInfo.title,
          artist: videoInfo.author.name,
          image: videoInfo.thumbnail || videoInfo.image,
          duration: String(videoInfo.seconds),
        }

        musicService
          .saveMusic(trackData)
          .then(() => {
            logger(
              "SYSTEM",
              FILE_NAME,
              "LOG",
              `Métadonnées sauvegardées en BDD pour : ${id}`,
            )
          })
          .catch((err) => {
            logger(
              "SYSTEM",
              FILE_NAME,
              "ERROR",
              `Échec sauvegarde BDD pour ${id}: ${err.message}`,
            )
          })
      }
    } catch (infoError: any) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Impossible de récupérer les infos yt-search pour ${id}: ${infoError.message}`,
      )
    }

    return successResponse(res, 200, { message: "Musique récupérée", id: id })
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur lors du téléchargement (${req.params.id}) : ${error.message}`,
    )
    return errorResponse(res, 500, "Impossible de récupérer ce titre")
  }
}

export const getPreview = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const { id } = req.params
  try {
    const filePath = await musicYoutubeService.getPreviewPath(id as string)
    res.setHeader("Content-Type", "audio/mpeg")

    logger(userId, FILE_NAME, "LOG", `Preview envoyée pour l'ID : ${id}`)
    return res.sendFile(filePath)
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur lors de la génération de la preview (${id}) : ${error.message}`,
    )
    return res.status(500).end()
  }
}

export const cancelDownload = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const { id } = req.params
    if (!id) return errorResponse(res, 400, "ID manquant")

    musicYoutubeService.cancelDownload(id as string)
    logger(
      userId,
      FILE_NAME,
      "WARN",
      `Téléchargement annulé par l'utilisateur pour l'ID : ${id}`,
    )

    return successResponse(res, 200, {
      message: "Téléchargement annulé côté serveur.",
    })
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur lors de l'annulation du téléchargement (${req.params.id}) : ${error.message}`,
    )
    return errorResponse(res, 500, "Erreur lors de l'annulation")
  }
}
