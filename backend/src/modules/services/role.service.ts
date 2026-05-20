import { logger } from "../../utils/logger.helper"
import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { Role } from "../types/Role"

const FILE_NAME = "role.service.ts"

export const roleService = {
  getAllRoles: async (): Promise<ApiResponse<Role[]>> => {
    try {
      const sql = `SELECT id, type FROM roles ORDER BY id ASC`
      const [rows]: any = await pool.query(sql)

      if (!rows || rows.length === 0) {
        return {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Aucun rôle trouvé dans le système.",
          },
        }
      }

      return {
        success: true,
        data: rows as Role[],
        error: null,
      }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur SQL getAllRoles: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Erreur lors de la récupération des rôles.",
        },
      }
    }
  },
}
