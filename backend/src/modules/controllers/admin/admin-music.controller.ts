import { Request, Response } from "express"
import { musicService } from "../../services/music.service"
import {
  successResponse,
  errorResponse,
} from "../../../utils/ApiResponse.helper"
import { logger } from "../../../utils/logger.helper"

const FILE_NAME = "admin-music.controller.ts"

export const getMusicsList = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await musicService.getAllMusics()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récup musiques: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur musics")
    }
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const updateMusic = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || "SYSTEM"
  const targetMusicId = req.params.id
  const { title, artist, image } = req.body

  if (!title || !artist || !image) {
    return errorResponse(
      res,
      400,
      "Le titre, l'artiste et l'image sont requis.",
    )
  }

  try {
    const result = await musicService.updateMusic(targetMusicId as string, {
      title,
      artist,
      image,
    })

    if (!result.success) {
      logger(
        adminId,
        FILE_NAME,
        "WARN",
        `Échec modification musique ${targetMusicId}: ${result.error?.message}`,
      )
      const statusCode = result.error?.code === "MUSIC_NOT_FOUND" ? 404 : 500
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur lors de la modification",
      )
    }

    logger(
      adminId,
      FILE_NAME,
      "INFO",
      `Musique ${targetMusicId} mise à jour par l'admin`,
    )
    return successResponse(res, 200, {
      message: "Musique mise à jour avec succès.",
    })
  } catch (error: any) {
    logger(adminId, FILE_NAME, "ERROR", error)
    return errorResponse(
      res,
      500,
      "Une erreur interne est survenue lors de la mise à jour.",
    )
  }
}

export const deleteMusic = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await musicService.deleteMusic(req.params.id as string)
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression musique ${req.params.id}: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur")
    }
    logger(userId, FILE_NAME, "INFO", `Musique ${req.params.id} supprimée`)
    return successResponse(res, 200, { message: "Musique supprimée" })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne")
  }
}
