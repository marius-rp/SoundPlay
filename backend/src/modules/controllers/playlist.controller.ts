import { Request, Response } from "express"
import { playlistService } from "../services/playlist.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { logger } from "../../utils/logger.helper"
import { ROLES } from "../../constant"
import path from "path"
import fs from "fs"

const FILE_NAME = "playlist.controller.ts"

export const getUserPlaylists = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Utilisateur non authentifié.")
    }

    const result = await playlistService.getUserPlaylists(userId)

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération playlists: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message ||
          "Erreur lors de la récupération des playlists.",
      )
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const createPlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Utilisateur non authentifié.")
    }

    const { title, description, cover_image, aleatoire } = req.body

    if (!title) {
      return errorResponse(res, 400, "Le titre de la playlist est obligatoire.")
    }

    const result = await playlistService.createPlaylist({
      user_id: userId,
      title,
      description,
      cover_image,
      aleatoire,
    } as any)

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec création playlist: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur création.",
      )
    }

    logger(userId, FILE_NAME, "INFO", `Nouvelle playlist créée: "${title}"`)
    return successResponse(res, 201, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const updatePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.id as string, 10)

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.")
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.")

    const { title, description } = req.body
    let { aleatoire } = req.body

    if (aleatoire === "true" || aleatoire === "1") aleatoire = true
    if (aleatoire === "false" || aleatoire === "0") aleatoire = false

    let cover_image = undefined
    if (req.file) {
      cover_image = `/storage/cover_playlist/${req.file.filename}?t=${Date.now()}`
    }

    const result = await playlistService.updatePlaylist(playlistId, userId, {
      title,
      description,
      cover_image,
      aleatoire,
    })

    if (!result.success) {
      const statusCode =
        result.error?.code === "NOT_FOUND_OR_UNAUTHORIZED" ? 403 : 500
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec mise à jour playlist ${playlistId}`,
      )
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur modification.",
      )
    }

    logger(userId, FILE_NAME, "INFO", `Playlist ${playlistId} mise à jour`)
    return successResponse(res, 200, {
      message: "Playlist mise à jour avec succès.",
      cover_image,
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const deletePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const userRoleId = (req as any).user?.role_id
  const isAdmin = userRoleId === ROLES.ADMIN

  try {
    const playlistId = parseInt(req.params.id as string, 10)

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.")
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.")

    const result = await playlistService.deletePlaylist(
      playlistId,
      userId,
      isAdmin,
    )

    if (!result.success) {
      const statusCode =
        result.error?.code === "NOT_FOUND_OR_UNAUTHORIZED" ? 403 : 500
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression playlist ${playlistId}: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur suppression.",
      )
    }

    logger(
      userId,
      FILE_NAME,
      "WARN",
      `Playlist ${playlistId} supprimée par l'utilisateur`,
    )
    return successResponse(res, 200, {
      message: "Playlist supprimée avec succès.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const getPlaylistById = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.id as string, 10)

    if (isNaN(playlistId)) {
      return errorResponse(res, 400, "ID de playlist invalide.")
    }

    const result = await playlistService.getPlaylistById(playlistId)

    if (!result.success) {
      const statusCode = result.error?.code === "NOT_FOUND" ? 404 : 500

      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération playlist ${playlistId}: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        statusCode,
        result.error?.message ||
          "Erreur lors de la récupération de la playlist.",
      )
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const updateAleatoirePlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const playlistId = parseInt(req.params.id as string, 10)

    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié.")
    if (isNaN(playlistId))
      return errorResponse(res, 400, "ID de playlist invalide.")

    const { title, description, cover_image, aleatoire } = req.body

    const result = await playlistService.updatePlaylist(playlistId, userId, {
      title,
      description,
      cover_image,
      aleatoire,
    })

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec aleatoire à jour playlist ${playlistId}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur modification.",
      )
    }

    logger(userId, FILE_NAME, "INFO", `Playlist ${playlistId} mise à jour`)
    return successResponse(res, 200, {
      message: "Playlist mise à jour avec succès.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const importCsvToPlaylist = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const playlistId = req.params.id

  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Utilisateur non authentifié.")
    }

    if (!req.file) {
      return errorResponse(res, 400, "Aucun fichier CSV fourni.")
    }

    const fileContent = req.file.buffer.toString("utf-8")
    const lines = fileContent
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "")

    if (lines.length < 2) {
      return errorResponse(
        res,
        400,
        "Le fichier CSV est vide ou ne contient que des en-têtes.",
      )
    }

    const headerLine = lines[0]
    const separator = headerLine.includes(";") ? ";" : ","

    const headers = headerLine
      .split(separator)
      .map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase())

    const titleIdx = headers.findIndex((h) => h === "title" || h === "titre")
    const artistIdx = headers.findIndex(
      (h) => h === "artist_name" || h === "artist" || h === "artiste",
    )
    const durationIdx = headers.findIndex(
      (h) => h === "duration" || h === "durée",
    )

    if (titleIdx === -1 || artistIdx === -1) {
      return errorResponse(
        res,
        400,
        "Le fichier CSV doit contenir au moins les colonnes 'title' et 'artist_name'.",
      )
    }

    const splitRegex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`)

    const tracks = lines
      .slice(1)
      .map((line, index) => {
        const columns = line
          .split(splitRegex)
          .map((col) => col.replace(/^"|"$/g, "").trim())

        let durationValue = null
        if (durationIdx !== -1 && columns[durationIdx]) {
          const parsedDuration = parseInt(columns[durationIdx], 10)
          if (!isNaN(parsedDuration)) durationValue = parsedDuration
        }

        return {
          id: `temp_${index}`,
          title: columns[titleIdx] || "",
          artist: columns[artistIdx] || "",
          duration: durationValue,
          status: "pending",
        }
      })
      .filter((track) => track.title !== "" && track.artist !== "")

    const timestamp = Date.now()
    const sessionFileName = `${userId}_${playlistId}_${timestamp}.json`

    const dir = path.join(process.cwd(), "cache_previews")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const filePath = path.join(dir, sessionFileName)

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          sessionId: sessionFileName,
          playlistId,
          totalTracks: tracks.length,
          queue: tracks,
        },
        null,
        2,
      ),
    )

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Session CSV import créée: ${sessionFileName} avec ${tracks.length} titres`,
    )

    return successResponse(res, 200, {
      message: "Fichier CSV analysé et mis en file d'attente avec succès.",
      sessionId: sessionFileName,
      totalTracks: tracks.length,
      queue: tracks,
    })
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur importCsvToPlaylist: ${error.message || error}`,
    )
    return errorResponse(
      res,
      500,
      "Erreur interne lors du traitement du fichier CSV.",
    )
  }
}
