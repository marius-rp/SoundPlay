import { ResultSetHeader } from "mysql2"
import pool from "../config/db"
import { User, UserRow } from "../types/User"
import { ApiResponse } from "../types/ApiResponse"
import { logger } from "../../utils/logger.helper"
import { USER_STATUS } from "../../constant"

const FILE_NAME = "user.service.ts"

export const userService = {
  create: async (userData: Partial<User>): Promise<number | null> => {
    const { login, password, name, surname, role_id } = userData
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "INSERT INTO users (login, password, name, surname, role_id, status) VALUES (?, ?, ?, ?, ?, 0)",
        [login, password, name, surname, role_id],
      )
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Utilisateur créé en base de données (en attente) : ${login}`,
      )
      return result.insertId
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur lors de la création de l'user : ${error.message}`,
      )
      throw error
    }
  },

  getByLogin: async (login: string): Promise<User | null> => {
    try {
      const [rows] = await pool.query<UserRow[]>(
        `SELECT u.id, u.login, u.password, u.name, u.surname, u.status,
         JSON_OBJECT('id', r.id, 'type', r.type) AS role
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.login = ? LIMIT 1`,
        [login],
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getByLogin (${login}) : ${error.message}`,
      )
      throw error
    }
  },

  getUserById: async (userId: number) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [
        userId,
      ])
      return rows[0] || null
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getUserById (${userId}) : ${error.message}`,
      )
      throw error
    }
  },

  getByEmail: async (email: string): Promise<User | null> => {
    try {
      const [rows]: any = await pool.query(
        "SELECT id, email, login FROM users WHERE email = ? LIMIT 1",
        [email],
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getByEmail (${email}) : ${error.message}`,
      )
      throw error
    }
  },

  delete: async (userId: number): Promise<boolean> => {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "DELETE FROM users WHERE id = ?",
        [userId],
      )
      if (result.affectedRows > 0)
        logger(
          "SYSTEM",
          FILE_NAME,
          "INFO",
          `Utilisateur ID ${userId} supprimé avec succès de la BDD`,
        )
      return result.affectedRows > 0
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur lors de la suppression de l'user (${userId}) : ${error.message}`,
      )
      throw error
    }
  },

  changePassword: async (
    userId: number,
    hashedPw: string,
  ): Promise<boolean> => {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPw, userId],
      )
      if (result.affectedRows > 0)
        logger(
          "SYSTEM",
          FILE_NAME,
          "INFO",
          `Mot de passe mis à jour en BDD pour l'utilisateur ID ${userId}`,
        )
      return result.affectedRows > 0
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur mise à jour mot de passe (ID: ${userId}) : ${error.message}`,
      )
      throw error
    }
  },

  updateStatus: async (
    userId: number,
    status: typeof USER_STATUS[keyof typeof USER_STATUS],
  ): Promise<ApiResponse<null>> => {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE users SET status = ? WHERE id = ?",
        [status, userId],
      )
      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: {
            code: "USER_NOT_FOUND",
            message: "Utilisateur introuvable.",
          },
        }
      }
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Statut de l'utilisateur ID ${userId} mis à jour : ${status}`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updateStatus (${userId}) : ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de mettre à jour le statut.",
        },
      }
    }
  },

  getAllUsers: async (): Promise<ApiResponse<any[]>> => {
    try {
      const sql = `
        SELECT u.id, u.login, u.name, u.surname, u.status,
               JSON_OBJECT('id', r.id, 'type', r.type) AS role,
               u.created_at
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        ORDER BY
          FIELD(u.status, 'pending', 'active', 'banned'),
          u.created_at DESC
      `
      const [rows]: any = await pool.query(sql)
      return { success: true, data: rows, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getAllUsers: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de récupérer les utilisateurs.",
        },
      }
    }
  },

  updateEmail: async (
    userId: number,
    email: string,
  ): Promise<ApiResponse<null>> => {
    try {
      const sql = `UPDATE users SET email = ? WHERE id = ?`
      const [result]: any = await pool.query(sql, [email, userId])
      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: { code: "USER_NOT_FOUND", message: "Utilisateur non trouvé." },
        }
      }
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `E-mail mis à jour pour l'utilisateur ID ${userId}`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updateEmail (${userId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de mettre à jour l'e-mail.",
        },
      }
    }
  },

  updateUser: async (
    userId: number,
    data: {
      name: string
      surname: string
      login: string
      role_id: number
      status: typeof USER_STATUS[keyof typeof USER_STATUS],
    },
  ): Promise<ApiResponse<null>> => {
    try {
      const { name, surname, login, role_id, status } = data
      const [result]: any = await pool.query(
        `UPDATE users SET name = ?, surname = ?, login = ?, role_id = ?, status = ? WHERE id = ?`,
        [name, surname, login, role_id, status, userId],
      )
      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: {
            code: "USER_NOT_FOUND",
            message: "Utilisateur non trouvé ou aucune modification.",
          },
        }
      }
      logger("SYSTEM", FILE_NAME, "INFO", `Utilisateur ID ${userId} mis à jour`)
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updateUser (${userId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de mettre à jour l'utilisateur.",
        },
      }
    }
  },

  deleteUser: async (userId: number): Promise<ApiResponse<null>> => {
    try {
      await pool.query(
        `UPDATE users SET status = ${USER_STATUS.DELETE} WHERE id = ?`,
        [userId],
      )

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Statut de l'utilisateur ID ${userId} passé en "Supprimé" (soft delete)`,
      )

      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur deleteUser (${userId}): ${error.message}`,
      )

      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de supprimer l'utilisateur.",
        },
      }
    }
  },
}
