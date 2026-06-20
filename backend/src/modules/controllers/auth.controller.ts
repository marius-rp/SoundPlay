import { Request, Response } from "express"
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { userService } from "../services/user.service"
import { emailService } from "../services/email.service"
import { successResponse, errorResponse } from "../../utils/ApiResponse.helper"
import { logger } from "../../utils/logger.helper"
import { validatePasswordStrength } from "../../utils/password.helper"
import { ROLES } from "../../constant"
import { playlistService } from "../services/playlist.service"

const FILE_NAME = "auth.controller.ts"

export const signUp = async (req: Request, res: Response) => {
  try {
    const { login, password, name, surname } = req.body
    if (!login || !password || !name || !surname)
      return errorResponse(res, 400, "Données manquantes")

    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid)
      return errorResponse(res, 400, passwordCheck.errors.join(" "))

    const userExists = await userService.getByLogin(login)
    if (userExists) return errorResponse(res, 409, "Ce login est déjà utilisé")

    const hashedPassword = await argon2.hash(password)
    const newUserId = await userService.create({
      login,
      password: hashedPassword,
      name,
      surname,
      role_id: ROLES.USER,
    })

    if (newUserId) {
      const newPlaylistSystem = await playlistService.createPlaylist({
        title: "Titres likés",
        description: "Vos titres likés",
        cover_image: "/storage/cover_playlist/liked_playlist_cover.jpg",
        aleatoire: false,
        is_system: true,
        user_id: newUserId,
      })

      if (!newPlaylistSystem.success) {
        logger(
          "SYSTEM",
          FILE_NAME,
          "ERROR",
          "Échec de la création de la playlist système pour le nouvel utilisateur (ID: ${newUserId})",
        )
      }

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Nouvel utilisateur inscrit (en attente) : ${login} (ID: ${newUserId})`,
      )
      return successResponse(res, 201, {
        id: newUserId,
        message:
          "Compte créé ! Il sera activé par un administrateur avant que vous puissiez vous connecter.",
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
    const { login, password } = req.body
    if (!login || !password)
      return errorResponse(res, 400, "Login et mot de passe requis")

    const user = await userService.getByLogin(login)

    if (
      !user ||
      !(await argon2.verify(user.password!, password)) ||
      !user.role
    ) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "WARN",
        `Tentative de connexion échouée pour : ${login}`,
      )
      return errorResponse(res, 401, "Identifiants incorrects")
    }

    if (user.status === 0) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "WARN",
        `Connexion refusée (compte en attente) : ${login}`,
      )
      return errorResponse(
        res,
        403,
        "Votre compte est en attente de validation par un administrateur.",
      )
    }
    if (user.status === 2) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "WARN",
        `Connexion refusée (compte banni) : ${login}`,
      )
      return errorResponse(
        res,
        403,
        "Votre compte a été suspendu. Contactez un administrateur.",
      )
    }

    const token = jwt.sign(
      {
        id: user.id,
        login: user.login,
        name: user.name,
        surname: user.surname,
        role_id: user?.role.id,
      },
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
    logger(user.id, FILE_NAME, "INFO", `Utilisateur connecté : ${login}`)
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
    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié")
    const user = await userService.getUserById(userId)
    if (!user) return errorResponse(res, 404, "Utilisateur introuvable")
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
    if (!userId || userId === "SYSTEM")
      return errorResponse(res, 401, "Non authentifié")
    const isDeleted = await userService.delete(userId)
    if (!isDeleted) return errorResponse(res, 404, "Utilisateur introuvable")
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

export const requestEmailVerification = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const userLogin = (req as any).user?.login
  try {
    const { email } = req.body
    if (!email) return errorResponse(res, 400, "E-mail requis")
    const emailExists = await userService.getByEmail(email)
    if (emailExists)
      return errorResponse(
        res,
        400,
        "Cet e-mail est déjà lié à un autre compte.",
      )
    const token = jwt.sign(
      { id: userId, newEmail: email },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" },
    )
    const verificationLink = `${process.env.NODE_FRONTEND}/verify-email?token=${token}`
    const emailSent = await emailService.sendVerificationEmail(
      email,
      userLogin,
      verificationLink,
    )
    if (!emailSent)
      return errorResponse(
        res,
        500,
        "Le service de messagerie rencontre un problème.",
      )
    logger(
      userId,
      FILE_NAME,
      "INFO",
      `E-mail de vérification envoyé à ${email}`,
    )
    return successResponse(res, 200, {
      message: "Un e-mail de confirmation vous a été envoyé !",
    })
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la préparation de l'e-mail")
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query
    if (!token || typeof token !== "string")
      return errorResponse(res, 400, "Token manquant ou invalide")
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    try {
      const alreadyTaken = await userService.getByEmail(decoded.newEmail)
      if (alreadyTaken && alreadyTaken.id !== decoded.id)
        return errorResponse(
          res,
          400,
          "Cet e-mail vient d'être pris par un autre utilisateur.",
        )
    } catch (err) {
      return errorResponse(
        res,
        400,
        "Le lien de validation est invalide ou a expiré.",
      )
    }
    const { id, newEmail } = decoded
    if (!id || !newEmail) return errorResponse(res, 400, "Token mal formé")
    const currentUser = await userService.getUserById(id)
    if (currentUser && currentUser.email === newEmail)
      return successResponse(res, 200, {
        message: "Votre e-mail a déjà été lié à votre compte !",
      })
    const updateResponse = await userService.updateEmail(id, newEmail)
    if (!updateResponse.success)
      return errorResponse(
        res,
        400,
        updateResponse.error?.message || "Erreur lors de la mise à jour",
      )
    logger(
      "SYSTEM",
      FILE_NAME,
      "INFO",
      `E-mail validé pour l'utilisateur ID ${id}`,
    )
    return successResponse(res, 200, {
      message: "Votre e-mail a bien été lié à votre compte !",
    })
  } catch (error: any) {
    logger("SYSTEM", FILE_NAME, "ERROR", error)
    return errorResponse(
      res,
      500,
      "Erreur interne lors de la vérification de l'e-mail",
    )
  }
}

export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword)
      return errorResponse(res, 400, "Données manquantes")
    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid)
      return errorResponse(res, 400, passwordCheck.errors.join(" "))
    const user = await userService.getUserById(userId)
    if (!user) return errorResponse(res, 404, "Utilisateur introuvable")
    const isOldCorrect = await argon2.verify(user.password, oldPassword)
    if (!isOldCorrect)
      return errorResponse(res, 401, "L'ancien mot de passe est incorrect")
    const hashedNewPassword = await argon2.hash(newPassword)
    const success = await userService.changePassword(userId, hashedNewPassword)
    if (success)
      return successResponse(res, 200, {
        message: "Mot de passe modifié avec succès",
      })
    throw new Error("Échec de la mise à jour du mot de passe")
  } catch (error: any) {
    logger(userId, FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur")
  }
}

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return errorResponse(res, 400, "E-mail requis")
    const userMinimal = await userService.getByEmail(email)
    if (!userMinimal)
      return successResponse(res, 200, {
        message:
          "Si un compte est associé à cet e-mail, un message de réinitialisation vous a été envoyé.",
      })
    const user = await userService.getUserById(userMinimal.id)
    const secret = (process.env.JWT_SECRET as string) + user.password
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "15m",
    })
    const resetLink = `${process.env.NODE_FRONTEND}/reset-password?token=${token}`
    const emailSent = await emailService.sendResetPasswordEmail(
      user.email,
      user.login,
      resetLink,
    )
    if (!emailSent)
      return errorResponse(res, 500, "Erreur lors de l'envoi de l'e-mail.")
    logger(
      "SYSTEM",
      FILE_NAME,
      "INFO",
      `Demande de reset MDP pour l'utilisateur ID ${user.id}`,
    )
    return successResponse(res, 200, {
      message: "Un e-mail de réinitialisation vous a été envoyé !",
    })
  } catch (error: any) {
    logger("SYSTEM", FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne du serveur")
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword)
      return errorResponse(res, 400, "Données manquantes")
    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid)
      return errorResponse(res, 400, passwordCheck.errors.join(" "))
    const decoded = jwt.decode(token) as any
    if (!decoded || !decoded.id)
      return errorResponse(res, 400, "Le lien est invalide ou expiré.")
    const user = await userService.getUserById(decoded.id)
    if (!user) return errorResponse(res, 404, "Utilisateur introuvable.")
    const secret = (process.env.JWT_SECRET as string) + user.password
    try {
      jwt.verify(token, secret)
    } catch (err) {
      return errorResponse(
        res,
        400,
        "Le lien de réinitialisation est invalide ou a expiré.",
      )
    }
    const hashedNewPassword = await argon2.hash(newPassword)
    const success = await userService.changePassword(user.id, hashedNewPassword)
    if (success)
      return successResponse(res, 200, {
        message: "Votre mot de passe a bien été réinitialisé !",
      })
    throw new Error("Échec de la mise à jour en base de données")
  } catch (error: any) {
    logger("SYSTEM", FILE_NAME, "ERROR", error)
    return errorResponse(res, 500, "Erreur interne lors de la réinitialisation")
  }
}

export const requestLoginRecovery = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return errorResponse(res, 400, "E-mail requis")
    const user = await userService.getByEmail(email)
    if (user)
      await emailService.sendRecoverLoginEmail(String(user.email), user.login)
    return successResponse(res, 200, {
      message:
        "Si un compte est associé à cet e-mail, vous recevrez votre identifiant par message.",
    })
  } catch (error: any) {
    logger("SYSTEM", "auth.controller.ts", "ERROR", error)
    return errorResponse(res, 500, "Erreur lors de la récupération")
  }
}
