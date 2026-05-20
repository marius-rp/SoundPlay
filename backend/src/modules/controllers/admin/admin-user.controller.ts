import { Request, Response } from "express"
import argon2 from "argon2"
import { userService } from "../../services/user.service"
import {
  successResponse,
  errorResponse,
} from "../../../utils/ApiResponse.helper"
import { logger } from "../../../utils/logger.helper"

const FILE_NAME = "admin-user.controller.ts"

export const getUsersList = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await userService.getAllUsers()
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récup utilisateurs: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur users")
    }
    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur.")
  }
}

export const createUser = async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id || "SYSTEM"

  try {
    const { email, password, name, surname, role_id } = req.body

    if (!email || !password || !name || !surname || !role_id) {
      return errorResponse(res, 400, "Tous les champs sont requis.")
    }

    const userExists = await userService.getByEmail(email)
    if (userExists) {
      logger(
        adminId,
        FILE_NAME,
        "WARN",
        `Tentative de création avec un email existant : ${email}`,
      )
      return errorResponse(res, 409, "Cet email est déjà utilisé.")
    }

    const hashedPassword = await argon2.hash(password)

    const newUserId = await userService.create({
      email,
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
        `Nouvel utilisateur créé par l'admin : ${email} (ID: ${newUserId}, Rôle: ${role_id})`,
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
  const { name, surname, email, role_id } = req.body

  if (!name || !surname || !email || role_id === undefined) {
    return errorResponse(
      res,
      400,
      "Tous les champs (nom, prénom, email, rôle) sont requis.",
    )
  }

  try {
    const result = await userService.updateUser(targetUserId, {
      name,
      surname,
      email,
      role_id: Number(role_id),
    })

    if (!result.success) {
      logger(
        adminId,
        FILE_NAME,
        "WARN",
        `Échec modification utilisateur ${targetUserId}: ${result.error?.message}`,
      )
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

export const deleteUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const result = await userService.deleteUser(Number(req.params.id))
    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec suppression utilisateur ${req.params.id}: ${result.error?.message}`,
      )
      return errorResponse(res, 500, result.error?.message || "Erreur")
    }
    logger(userId, FILE_NAME, "INFO", `Utilisateur ${req.params.id} supprimé`)
    return successResponse(res, 200, { message: "Utilisateur supprimé" })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne")
  }
}
