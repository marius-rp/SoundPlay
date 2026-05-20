import { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { errorResponse } from "../../utils/ApiResponse.helper"
import { JwtPayload } from "../types/JwtPayload"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "authMiddleware.ts"

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token

    if (!token) {
      return errorResponse(res, 401, "Accès refusé. Veuillez vous connecter.")
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload

    req.user = decoded

    next()
  } catch (error: any) {
    logger(
      "SYSTEM",
      FILE_NAME,
      "WARN",
      `Échec d'authentification : ${error.message}`,
    )

    res.clearCookie("token")
    return errorResponse(res, 401, "Session invalide ou expirée.")
  }
}
