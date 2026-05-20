import { Request, Response } from "express"
import { proxyService } from "../services/proxy.service"
import { proxyManager } from "../../utils/proxyManager.helper"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "proxy.controller.ts"

export const getProxies = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await proxyService.getAllProxies()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération proxys: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur")
    }
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne.")
  }
}

export const createProxy = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const { name, host, port } = req.body

  try {
    if (!name || !host || !port) {
      return errorResponse(
        res,
        400,
        "Veuillez renseigner le nom, l'hôte et le port du proxy.",
      )
    }

    const result = await proxyService.addProxy(req.body)
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec ajout proxy: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur")
    }

    logger(userId, FILE_NAME, "INFO", `Nouveau proxy ajouté: ${name} (${host})`)
    return successResponse(res, 201, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne.")
  }
}

export const removeProxy = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  const id = Number(req.params.id)

  try {
    const result = await proxyService.deleteProxy(id)

    if (!result.success) {
      const status = result.error?.code === "NOT_FOUND" ? 404 : 500
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression proxy ${id}: ${result.error?.message}`,
      )
      return errorResponse(res, status, result.error?.message || "Erreur")
    }

    await proxyManager.refreshProxies()

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Proxy ID ${id} supprimé et cache RAM rafraîchi`,
    )
    return successResponse(res, 200, { message: "Le proxy a été supprimé." })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne.")
  }
}

export const runProxyTest = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await proxyService.testProxy(Number(req.params.id))

    if (result.status === "online") {
      await proxyManager.refreshProxies()
      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Proxy #${req.params.id} validé et injecté dans le moteur.`,
      )
    } else {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Test proxy #${req.params.id} échoué (Offline).`,
      )
    }

    return successResponse(res, 200, result)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de l'exécution du test.")
  }
}

export const toggleProxy = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const id = Number(req.params.id)
    const { is_active } = req.body

    if (typeof is_active !== "boolean") {
      return errorResponse(
        res,
        400,
        "Le paramètre is_active doit être un booléen.",
      )
    }

    const result = await proxyService.toggleProxy(id, is_active)

    if (!result.success) {
      const status = result.error?.code === "NOT_FOUND" ? 404 : 500
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec bascule état proxy ${id}: ${result.error?.message}`,
      )
      return errorResponse(
        res,
        status,
        result.error?.message || "Erreur de modification",
      )
    }

    await proxyManager.refreshProxies()

    logger(
      userId,
      FILE_NAME,
      "INFO",
      `Proxy ${id} ${is_active ? "réactivé" : "mis en pause"}`,
    )
    return successResponse(res, 200, {
      message: is_active ? "Proxy réactivé." : "Proxy mis en pause.",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la modification du proxy.")
  }
}
