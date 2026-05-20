import { Request, Response } from "express"
import { adminService } from "../../services/admin.service"
import { systemService } from "../../services/system.service"
import {
  successResponse,
  errorResponse,
} from "../../../utils/ApiResponse.helper"
import { logger } from "../../../utils/logger.helper"

const FILE_NAME = "admin-system.controller.ts"

export const getStats = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await adminService.getDashboardStats()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récup stats: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur stats")
    }
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const clearCache = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await systemService.clearSearchCache()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec vidage cache: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur lors du vidage du cache.",
      )
    }
    logger(userId, FILE_NAME, "INFO", "Cache de recherche réinitialisé")
    return successResponse(res, 200, {
      message: "Le cache de recherche a été réinitialisé.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Une erreur interne est survenue.")
  }
}

export const clearPreviews = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await systemService.clearPreviewCache()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression previews: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur lors de la purge des fichiers.",
      )
    }
    logger(userId, FILE_NAME, "INFO", "Fichiers de préécoute supprimés")
    return successResponse(res, 200, {
      message: "Les fichiers de préécoute ont été supprimés.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Une erreur interne est survenue.")
  }
}

export const getDownloadSettings = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const result = await systemService.getDownloadLinks()
  if (!result.success) {
    logger(
      userId,
      FILE_NAME,
      "WARN",
      `Échec récup download settings: ${result.error?.message}`,
    )
    return errorResponse(
      res,
      500,
      result.error?.message || "Erreur lors de la récupération",
    )
  }
  return successResponse(res, 200, result.data)
}

export const updateDownloadSetting = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const { fileName, url } = req.body

  if (!fileName || !url) {
    return errorResponse(res, 400, "Le nom du fichier et l'URL sont requis.")
  }

  const result = await systemService.updateDownloadLink(fileName, url)
  if (!result.success) {
    logger(
      userId,
      FILE_NAME,
      "WARN",
      `Échec mise à jour download link ${fileName}: ${result.error?.message}`,
    )
    return errorResponse(
      res,
      500,
      result.error?.message || "Erreur lors de la mise à jour",
    )
  }

  logger(
    userId,
    FILE_NAME,
    "INFO",
    `Lien de téléchargement mis à jour pour ${fileName}`,
  )
  return successResponse(res, 200, {
    message: "Paramètre mis à jour avec succès",
  })
}

export const updateBinaries = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const result = await systemService.updateAllBinaries()
  if (!result.success) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Échec mise à jour binaires: ${result.error?.message}`,
    )
    return errorResponse(
      res,
      500,
      result.error?.message || "Erreur lors de la mise à jour.",
    )
  }
  logger(userId, FILE_NAME, "INFO", "Binaires mis à jour avec succès")
  return successResponse(res, 200, {
    message: "Utilitaires mis à jour avec succès.",
  })
}

export const getLogs = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await systemService.getTodayLogs()
    if (!result.success) {
      return errorResponse(res, 500, result.error?.message || "Erreur logs")
    }
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne serveur")
  }
}
