import { Request, Response } from "express"
import argon2 from "argon2"
import { userService } from "../../services/user.service"
import {
  successResponse,
  errorResponse,
} from "../../../utils/ApiResponse.helper"
import { logger } from "../../../utils/logger.helper"
import { USER_STATUS } from "../../../constant"

const FILE_NAME = "admin-user.controller.ts"

export const getUsersList = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await userService.getAllUsers()
    if (!result.success)
      return errorResponse(res, 500, result.error?.message || "Erreur users")
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const createUser = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || "SYSTEM"
  try {
    const { login, password, name, surname, role_id } = req.body
    if (!login || !password || !name || !surname || !role_id)
      return errorResponse(res, 400, "Tous les champs sont requis.")

    const userExists = await userService.getByLogin(login)
    if (userExists)
      return errorResponse(res, 409, "Cet login est déjà utilisé.")

    const hashedPassword = await argon2.hash(password)
    const newUserId = await userService.create({
      login,
      password: hashedPassword,
      name,
      surname,
      role_id: Number(role_id),
    })

    if (newUserId) {
      logger(
        adminId,
        FILE_NAME,
        "INFO",
        `Nouvel utilisateur créé par l'admin : ${login} (ID: ${newUserId})`,
      )
      return successResponse(res, 201, {
        id: newUserId,
        message: "Utilisateur créé avec succès.",
      })
    }
    throw new Error("Échec de la création en base de données.")
  } catch (error: any) {
    logger(adminId, FILE_NAME, "ERROR", error)
    return errorResponse(
      res,
      500,
      "Une erreur est survenue lors de la création de l'utilisateur.",
    )
  }
}

export const updateUser = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || "SYSTEM"
  const targetUserId = Number(req.params.id)
  const { name, surname, login, role_id, status } = req.body

  if (!name || !surname || !login || !role_id || !status === undefined)
    return errorResponse(
      res,
      400,
      "Tous les champs (nom, prénom, login, rôle, statut) sont requis.",
    )

  try {
    const result = await userService.updateUser(targetUserId, {
      name,
      surname,
      login,
      role_id: Number(role_id),
      status: status as typeof USER_STATUS[keyof typeof USER_STATUS],
    })
    if (!result.success) {
      const statusCode = result.error?.code === "USER_NOT_FOUND" ? 404 : 500
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
      `Utilisateur ${targetUserId} mis à jour par l'admin ${adminId}`,
    )
    return successResponse(res, 200, {
      message: "Utilisateur mis à jour avec succès.",
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

export const updateUserStatus = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || "SYSTEM"
  const targetUserId = Number(req.params.id)
  const { status } = req.body

  if (!Object.values(USER_STATUS).includes(status))
    return errorResponse(
      res,
      400,
      `Statut invalide. Valeurs acceptées : ${Object.values(USER_STATUS).join(", ")}.`,
    )

  try {
    const result = await userService.updateStatus(targetUserId, status)
    if (!result.success) {
      const statusCode = result.error?.code === "USER_NOT_FOUND" ? 404 : 500
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur lors de la mise à jour du statut",
      )
    }
    logger(
      adminId,
      FILE_NAME,
      "INFO",
      `Statut de l'utilisateur ${targetUserId} changé en "${status}" par l'admin ${adminId}`,
    )
    return successResponse(res, 200, {
      message: `Statut mis à jour : ${status}`,
    })
  } catch (error: any) {
    logger(adminId, FILE_NAME, "ERROR", error)
    return errorResponse(
      res,
      500,
      "Erreur interne lors de la mise à jour du statut.",
    )
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await userService.deleteUser(Number(req.params.id))
    if (!result.success)
      return errorResponse(res, 500, result.error?.message || "Erreur")
    logger(userId, FILE_NAME, "INFO", `Utilisateur ${req.params.id} supprimé`)
    return successResponse(res, 200, { message: "Utilisateur supprimé" })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne")
  }
}
