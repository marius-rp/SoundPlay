import { Request, Response } from "express"
import { musicService } from "../services/music.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { Track } from "../types/Music"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "music.controller.ts"

export const saveMusic = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const { id, title, artist, image, duration } = req.body

    if (!id || !title || !artist) {
      return errorResponse(
        res,
        400,
        "Données incomplètes. L'ID, le titre et l'artiste sont obligatoires.",
      )
    }

    const trackData: Track = {
      id: id.trim(),
      title: title.trim(),
      artist: artist.trim(),
      image: image || "",
      duration: duration,
    }

    const result = await musicService.saveMusic(trackData)

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec enregistrement BDD (${id}): ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur lors de l'enregistrement en BDD.",
      )
    }

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Musique enregistrée avec succès: ${trackData.title} (ID: ${trackData.id})`,
    )
    return successResponse(res, 201, {
      message: "Musique ajoutée au catalogue avec succès.",
      id: trackData.id,
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const getMusicById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const { id } = req.params

    if (!id) {
      return errorResponse(res, 400, "L'ID de la musique est manquant.")
    }

    const result = await musicService.getMusicById(id as string)

    if (!result.success) {
      const statusCode = result.error?.code === "NOT_FOUND" ? 404 : 500

      if (statusCode === 404) {
        logger(userId, FILE_NAME, "LOG", `Musique non trouvée: ${id}`)
      } else {
        logger(
          userId,
          FILE_NAME,
          "WARN",
          `Erreur récupération musique ${id}: ${result.error?.message}`,
        )
      }

      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur lors de la récupération.",
      )
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}
