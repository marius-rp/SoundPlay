import fs from "fs"
import path from "path"
import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { logger } from "../../utils/logger.helper"
import { formatBytes } from "../../utils/storage.helper"
import { proxyService } from "./proxy.service"
import { LINK_FILES_COVERS, LINK_FILES_MUSICS } from "../../constant"

const FILE_NAME = "admin.service.ts"

const STORAGE_MUSIC_PATH = path.join(process.cwd(), LINK_FILES_MUSICS)
const STORAGE_COVER_PATH = path.join(process.cwd(), LINK_FILES_COVERS)

const calculateFolderSize = (folderPath: string): number => {
  let totalSizeBytes = 0
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const stats = fs.statSync(filePath)
      if (stats.isFile()) {
        totalSizeBytes += stats.size
      }
    }
  }
  return totalSizeBytes
}

export const adminService = {
  getDashboardStats: async (): Promise<
    ApiResponse<{
      totalUsers: number
      totalMusics: number
      totalPlaylists: number
      storageUsedMusics: string
      storageUsedCovers: string
      totalProxies: number
      onlineProxies: number
    }>
  > => {
    try {
      const [[userResult]]: any = await pool.query(
        `SELECT COUNT(*) as count FROM users`,
      )
      const [[musicResult]]: any = await pool.query(
        `SELECT COUNT(*) as count FROM musics`,
      )
      const [[playlistResult]]: any = await pool.query(
        `SELECT COUNT(*) as count FROM playlists`,
      )
      const proxySummary = await proxyService.getProxyStatusSummary()

      const musicsSizeBytes = calculateFolderSize(STORAGE_MUSIC_PATH)
      const coversSizeBytes = calculateFolderSize(STORAGE_COVER_PATH)

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        "Statistiques du dashboard récupérées avec succès",
      )

      return {
        success: true,
        data: {
          totalUsers: userResult.count,
          totalMusics: musicResult.count,
          totalPlaylists: playlistResult.count,
          storageUsedMusics: formatBytes(musicsSizeBytes),
          storageUsedCovers: formatBytes(coversSizeBytes),
          totalProxies: proxySummary.total,
          onlineProxies: proxySummary.online,
        },
        error: null,
      }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur stats dashboard: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Erreur lors de la récupération des statistiques.",
        },
      }
    }
  },

  updatePlaylist: async (
    playlistId: number,
    data: { title: string; cover_image?: string },
  ): Promise<ApiResponse<null>> => {
    try {
      const [[oldPlaylist]]: any = await pool.query(
        `SELECT cover_image FROM playlists WHERE id = ?`,
        [playlistId],
      )

      if (!oldPlaylist) {
        return {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "Playlist introuvable." },
        }
      }

      if (data.cover_image && oldPlaylist.cover_image) {
        const oldFilename = path.basename(oldPlaylist.cover_image)
        const oldFilePath = path.join(STORAGE_COVER_PATH, oldFilename)

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath)
          logger(
            "SYSTEM",
            FILE_NAME,
            "INFO",
            `Ancienne cover supprimée: ${oldFilename}`,
          )
        }
      }

      let query = `UPDATE playlists SET title = ?`
      const queryParams: any[] = [data.title.trim()]

      if (data.cover_image) {
        query += `, cover_image = ?`
        queryParams.push(data.cover_image)
      }

      query += ` WHERE id = ?`
      queryParams.push(playlistId)

      await pool.query(query, queryParams)

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Playlist ID ${playlistId} modifiée par l'admin avec succès`,
      )

      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updatePlaylist admin (${playlistId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de modifier la playlist.",
        },
      }
    }
  },

  deletePlaylist: async (playlistId: number): Promise<ApiResponse<null>> => {
    try {
      await pool.query(`DELETE FROM playlisttracks WHERE playlist_id = ?`, [
        playlistId,
      ])
      await pool.query(`DELETE FROM playlists WHERE id = ?`, [playlistId])
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Playlist ID ${playlistId} et ses morceaux supprimés`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur deletePlaylist (${playlistId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_DELETE_ERROR",
          message: "Impossible de supprimer la playlist.",
        },
      }
    }
  },
}
