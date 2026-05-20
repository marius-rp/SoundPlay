import { Request, Response } from "express"
import { playlistTrackService } from "../services/playlistTrack.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "playlistTrack.controller.ts"

export const addTrackToPlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.playlistId as string, 10)
    const { musicId } = req.body

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.")
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.")
    if (!musicId)
      return errorResponse(res, 400, "L'ID de la musique est obligatoire.")

    const result = await playlistTrackService.addTrackToPlaylist(
      playlistId,
      musicId,
      userId,
    )

    if (!result.success) {
      let statusCode = 500
      if (result.error?.code === "UNAUTHORIZED_OR_NOT_FOUND") statusCode = 403
      if (result.error?.code === "DUPLICATE_TRACK") statusCode = 409

      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec ajout musique ${musicId} à playlist ${playlistId}: ${result.error?.message}`,
      )

      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur d'ajout.",
      )
    }

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Musique ${musicId} ajoutée à la playlist ${playlistId}`,
    )
    return successResponse(res, 201, {
      message: "Musique ajoutée avec succès.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const getPlaylistTracks = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.playlistId as string, 10)

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.")
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.")

    const result = await playlistTrackService.getPlaylistTracks(
      playlistId,
      userId,
    )

    if (!result.success) {
      const statusCode =
        result.error?.code === "UNAUTHORIZED_OR_NOT_FOUND" ? 403 : 500

      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération pistes playlist ${playlistId}: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur de récupération.",
      )
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const removeTrackFromPlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.playlistId as string, 10)
    const musicId = req.params.musicId as string

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.")
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.")
    if (!musicId) return errorResponse(res, 400, "ID de musique invalide.")

    const result = await playlistTrackService.removeTrackFromPlaylist(
      playlistId,
      musicId,
      userId,
    )

    if (!result.success) {
      let statusCode = 500
      if (result.error?.code === "UNAUTHORIZED_OR_NOT_FOUND") statusCode = 403
      if (result.error?.code === "NOT_FOUND") statusCode = 404

      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec retrait musique ${musicId} de playlist ${playlistId}: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur de suppression.",
      )
    }

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Musique ${musicId} retirée de la playlist ${playlistId}`,
    )
    return successResponse(res, 200, {
      message: "Musique retirée de la playlist.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const checkTrackInPlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.playlistId as string, 10)
    const musicId = req.params.musicId as string

    if (isNaN(playlistId) || !musicId) {
      return errorResponse(res, 400, "Paramètres invalides.")
    }

    const result = await playlistTrackService.checkTrackInPlaylist(
      playlistId,
      musicId,
    )

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur checkTrackInPlaylist: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur de vérification.",
      )
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}
