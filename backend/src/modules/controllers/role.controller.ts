import { Request, Response } from "express"
import { errorResponse, successResponse } from "../../utils/ApiResponse.helper"
import { logger } from "../../utils/logger.helper"
import { roleService } from "../services/role.service"

const FILE_NAME = "role.controller.ts"

export const getRolesList = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"

  try {
    const result = await roleService.getAllRoles()

    if (!result.success) {
      logger(
        userId,
        FILE_NAME,
        "WARN",
        `Échec récupération rôles: ${result.error?.message}`,
      )

      const statusCode = result.error?.code === "NOT_FOUND" ? 404 : 500
      return errorResponse(
        res,
        statusCode,
        result.error?.message || "Erreur rôles",
      )
    }

    return successResponse(res, 200, result.data)
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur interne getRolesList: ${error.message}`,
    )
    return errorResponse(
      res,
      500,
      "Une erreur interne est survenue lors de la récupération des rôles.",
    )
  }
}
