import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { logger } from "../../utils/logger.helper"
import { MAX_HISTORY_LIMIT } from "../../constant"

const FILE_NAME = "search-history.service.ts"


export const searchHistoryService = {
  saveSearch: async (userId: number, query: string): Promise<void> => {
    try {
      const trimmedQuery = query.trim()

      const insertSql = `INSERT INTO searchhistory (query, userId) VALUES (?, ?)`
      await pool.query(insertSql, [trimmedQuery, userId])

      const limitSql = `
        DELETE FROM searchhistory 
        WHERE userId = ? 
        AND id NOT IN (
          SELECT id FROM (
            SELECT id FROM searchhistory 
            WHERE userId = ? 
            ORDER BY id DESC 
            LIMIT ${MAX_HISTORY_LIMIT}
          ) AS tmp
        )
      `
      await pool.query(limitSql, [userId, userId])

      logger(
        userId,
        FILE_NAME,
        "LOG",
        `Recherche sauvegardée et historique nettoyé : "${trimmedQuery}"`,
      )
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur SQL saveSearch: ${error.message}`,
      )
    }
  },

  getHistory: async (userId: number): Promise<ApiResponse<string[]>> => {
    try {
      const sql = `
        SELECT query
        FROM searchhistory 
        WHERE userId = ? 
        GROUP BY query 
        ORDER BY MAX(id) DESC 
        LIMIT ${MAX_HISTORY_LIMIT}
      `

      const [rows]: any = await pool.query(sql, [userId])
      const history = rows.map((row: any) => row.query)

      return {
        success: true,
        data: history,
        error: null,
      }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur SQL getHistory: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_ERROR",
          message: "Impossible de charger l'historique",
        },
      }
    }
  },

  clearHistory: async (userId: number): Promise<ApiResponse<null>> => {
    try {
      const sql = `DELETE FROM searchhistory WHERE userId = ?`
      await pool.query(sql, [userId])

      logger(userId, FILE_NAME, "INFO", "Historique de recherche vidé")

      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur SQL clearHistory: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: { code: "DB_ERROR", message: "Erreur lors de la suppression" },
      }
    }
  },

  deleteTerm: async (
    userId: number,
    query: string,
  ): Promise<ApiResponse<null>> => {
    try {
      const trimmedQuery = query.trim()
      const sql = `DELETE FROM searchhistory WHERE userId = ? AND query = ?`
      await pool.query(sql, [userId, trimmedQuery])

      logger(
        userId,
        FILE_NAME,
        "LOG",
        `Terme "${trimmedQuery}" supprimé de l'historique`,
      )

      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur SQL deleteTerm: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_ERROR",
          message: "Erreur lors de la suppression du terme",
        },
      }
    }
  },
}
