import fs from "fs"
import path from "path"
import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { logger } from "../../utils/logger.helper"
import fetch from "node-fetch"
import { musicYoutubeService } from "./music-youtube.service"

const FILE_NAME = "system.service.ts"
const BIN_DIR = path.resolve(process.cwd())
const LOG_PATH = path.resolve(process.cwd(), "logs", "server.log")

export const systemService = {
  getDownloadLinks: async (): Promise<ApiResponse<any[]>> => {
    try {
      const [rows]: any = await pool.query(
        "SELECT `key` as fileName, `value` as url FROM settings",
      )
      const dataWithStats = rows.map((row: any) => {
        const filePath = path.join(BIN_DIR, row.fileName)
        const lastUpdate = fs.existsSync(filePath)
          ? fs.statSync(filePath).mtime
          : null
        return { fileName: row.fileName, url: row.url, lastUpdate }
      })
      return { success: true, data: dataWithStats, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getDownloadLinks: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: { code: "DB_ERROR", message: "Erreur de lecture" },
      }
    }
  },

  updateDownloadLink: async (
    fileName: string,
    url: string,
  ): Promise<ApiResponse<null>> => {
    try {
      await pool.query(
        "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
        [fileName, url, url],
      )
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Lien de téléchargement mis à jour pour ${fileName}`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updateDownloadLink (${fileName}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de sauvegarder le lien",
        },
      }
    }
  },

  updateAllBinaries: async (): Promise<ApiResponse<null>> => {
    try {
      const [rows]: any = await pool.query(
        "SELECT `key` as fileName, `value` as url FROM settings",
      )
      if (rows.length === 0) {
        logger(
          "SYSTEM",
          FILE_NAME,
          "WARN",
          "Tentative de mise à jour binaire sans configuration",
        )
        return {
          success: false,
          data: null,
          error: { code: "NO_CONFIG", message: "Aucun lien configuré." },
        }
      }

      for (const row of rows) {
        const { fileName, url } = row
        const filePath = path.join(BIN_DIR, fileName)
        logger(
          "SYSTEM",
          FILE_NAME,
          "INFO",
          `Début du téléchargement: ${fileName}`,
        )

        const response = await fetch(url)
        if (!response.ok)
          throw new Error(`Erreur HTTP ${response.status} pour ${fileName}`)

        const fileStream = fs.createWriteStream(filePath)
        await new Promise((resolve, reject) => {
          response.body.pipe(fileStream)
          response.body.on("error", (err: Error) => {
            fileStream.close()
            reject(err)
          })
          fileStream.on("finish", () => {
            fileStream.close()
            resolve(true)
          })
          fileStream.on("error", (err: Error) => {
            fileStream.close()
            reject(err)
          })
        })
        logger(
          "SYSTEM",
          FILE_NAME,
          "INFO",
          `Binaire mis à jour avec succès: ${fileName}`,
        )
      }
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Échec MAJ binaire: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DOWNLOAD_FAILED",
          message: error.message || "Erreur de téléchargement",
        },
      }
    }
  },

  getTodayLogs: async (): Promise<ApiResponse<string>> => {
    try {
      if (!fs.existsSync(LOG_PATH))
        return { success: true, data: "Aucun log pour le moment.", error: null }
      const logs = fs.readFileSync(LOG_PATH, "utf-8")
      return { success: true, data: logs, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur lecture logs: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "LOG_READ_ERROR",
          message: "Impossible de lire les logs.",
        },
      }
    }
  },

  clearSearchCache: async (): Promise<ApiResponse<null>> => {
    musicYoutubeService.clearSearchCache()
    logger("SYSTEM", FILE_NAME, "INFO", "Cache de recherche vidé manuellement")
    return { success: true, data: null, error: null }
  },

  clearPreviewCache: async (): Promise<ApiResponse<null>> => {
    await musicYoutubeService.clearPreviewFiles()
    logger("SYSTEM", FILE_NAME, "INFO", "Cache des fichiers de préécoute vidé")
    return { success: true, data: null, error: null }
  },
}
