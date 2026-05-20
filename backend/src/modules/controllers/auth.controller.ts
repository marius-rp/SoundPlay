import { Request, Response } from "express"
import argon2 from "argon2"
import { userService } from "../services/user.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import jwt from "jsonwebtoken"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "auth.controller.ts"

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password, name, surname } = req.body

    if (!email || !password || !name || !surname) {
      return errorResponse(res, 400, "Données manquantes")
    }

    const userExists = await userService.getByEmail(email)
    if (userExists) {
      return errorResponse(res, 409, "Cet email est déjà utilisé")
    }

    const hashedPassword = await argon2.hash(password)

    const newUserId = await userService.create({
      email,
      password: hashedPassword,
      name,
      surname,
      role_id: 1,
    })

    if (newUserId) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Nouvel utilisateur inscrit : ${email} (ID: ${newUserId})`,
      )
      return successResponse(res, 201, {
        id: newUserId,
        message: "Utilisateur créé !",
      })
    }

    throw new Error("Échec de la création en base de données")
  } catch (error: any) {
    logger("SYSTEM", FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de l'inscription")
  }
}

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return errorResponse(res, 400, "Email et mot de passe requis")
    }

    const user = await userService.getByEmail(email)

    if (!user || !(await argon2.verify(user.password!, password))) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "WARN",
        `Tentative de connexion échouée pour : ${email}`,
      )
      return errorResponse(res, 401, "Identifiants incorrects")
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" },
    )

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE as boolean | "lax" | "strict" | "none",
      maxAge: 24 * 60 * 60 * 1000,
    })

    const { password: _, ...userPublic } = user
    logger(user.id, FILE_NAME, "INFO", `Utilisateur connecté : ${email}`)

    return successResponse(res, 200, {
      user: userPublic,
      message: "Connexion réussie",
    })
  } catch (error: any) {
    logger("SYSTEM", FILE_NAME, "ERROR", error)
    return errorResponse(
      res,
      500,
      "Une erreur est survenue lors de la connexion",
    )
  }
}

export const getMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Non authentifié")
    }

    const user = await userService.getUserById(userId)
    if (!user) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Requête getMe : Utilisateur ID ${userId} introuvable`,
      )
      return errorResponse(res, 404, "Utilisateur introuvable")
    }

    const { password: _, ...userPublic } = user
    return successResponse(res, 200, userPublic)
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la récupération du profil")
  }
}

export const logout = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE as boolean | "lax" | "strict" | "none",
    })

    logger(userId, FILE_NAME, "INFO", "Déconnexion réussie")
    return successResponse(res, 200, { message: "Déconnexion réussie" })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la déconnexion")
  }
}

export const deleteMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    if (!userId || userId === "SYSTEM") {
      return errorResponse(res, 401, "Non authentifié")
    }

    const isDeleted = await userService.delete(userId)

    if (!isDeleted) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Tentative de suppression : Utilisateur ID ${userId} introuvable`,
      )
      return errorResponse(res, 404, "Utilisateur introuvable")
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE as boolean | "lax" | "strict" | "none",
    })

    logger(
      userId,
      FILE_NAME,
      "WARN",
      "Compte supprimé définitivement par l'utilisateur",
    )
    return successResponse(res, 200, {
      message: "Compte supprimé définitivement",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la suppression du compte")
  }
}

export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 400, "Données manquantes")
    }

    const user = await userService.getUserById(userId)
    if (!user) {
      return errorResponse(res, 404, "Utilisateur introuvable")
    }

    const isOldCorrect = await argon2.verify(user.password, oldPassword)
    if (!isOldCorrect) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        "Échec changement de mot de passe : Ancien mot de passe incorrect",
      )
      return errorResponse(res, 401, "L'ancien mot de passe est incorrect")
    }

    const hashedNewPassword = await argon2.hash(newPassword)
    const success = await userService.changePassword(userId, hashedNewPassword)

    if (success) {
      logger(userId, FILE_NAME, "INFO", "Mot de passe modifié avec succès")
      return successResponse(res, 200, {
        message: "Mot de passe modifié avec succès",
      })
    }

    throw new Error(
      "Échec de la mise à jour du mot de passe en base de données",
    )
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur")
  }
}
