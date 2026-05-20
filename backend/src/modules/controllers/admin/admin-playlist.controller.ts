import { Request, Response } from "express"
import { playlistService } from "../../services/playlist.service"
import { adminService } from "../../services/admin.service"
import {
  successResponse,
  errorResponse,
} from "../../../utils/ApiResponse.helper"
import { logger } from "../../../utils/logger.helper"

const FILE_NAME = "admin-playlist.controller.ts"

export const getPlaylistsList = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await playlistService.getAllPlaylists()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récup playlists: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur playlists",
      )
    }
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const updatePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const playlistId = Number(req.params.id)
  const { title } = req.body

  try {
    if (!title) {
      return errorResponse(res, 400, "Le titre est obligatoire.")
    }

    let cover_image: string | undefined = undefined
    if (req.file) {
      cover_image = `${req.protocol}://${req.get("host")}/storage/covers/${req.file.filename}`
    }

    const result = await adminService.updatePlaylist(playlistId, {
      title,
      cover_image,
    })

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec modif playlist ${playlistId}: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        400,
        result.error?.message || "Erreur modification",
      )
    }

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Playlist ${playlistId} modifiée par l'admin`,
    )
    return successResponse(res, 200, {
      message: "Playlist mise à jour avec succès",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error.message)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const deletePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await adminService.deletePlaylist(Number(req.params.id))
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression playlist ${req.params.id}: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur")
    }
    logger(userId, FILE_NAME, "INFO", `Playlist ${req.params.id} supprimée`)
    return successResponse(res, 200, { message: "Playlist supprimée" })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne")
  }
}
