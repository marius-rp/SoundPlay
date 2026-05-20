import { Request, Response } from "express"
import { searchHistoryService } from "../services/search-history.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "history.controller.ts"

export const getHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"

  if (!userId || userId === "SYSTEM") {
    return errorResponse(res, 401, "Utilisateur non authentifié.")
  }

  try {
    const result = await searchHistoryService.getHistory(userId)

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération historique: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur BDD")
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Impossible de récupérer l'historique.")
  }
}

export const deleteHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"

  if (!userId || userId === "SYSTEM") {
    return errorResponse(res, 401, "Utilisateur non authentifié.")
  }

  try {
    const result = await searchHistoryService.clearHistory(userId)

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression historique complet: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        500,
        result.error?.message || "Erreur suppression",
      )
    }

    logger(
      userId,
      FILE_NAME,
      "INFO",
      "Historique de recherche entièrement supprimé",
    )
    return successResponse(res, 200, null)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(
      res,
      500,
      "Erreur lors de la suppression de l'historique.",
    )
  }
}

export const deleteHistoryTerm = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const { term } = req.body

  if (!userId || userId === "SYSTEM")
    return errorResponse(res, 401, "Non authentifié")
  if (!term) return errorResponse(res, 400, "Terme manquant")

  try {
    const result = await searchHistoryService.deleteTerm(userId, term)

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression terme "${term}": ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur")
    }

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Terme "${term}" supprimé de l'historique`,
    )
    return successResponse(res, 200, null)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur serveur")
  }
}
