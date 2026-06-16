import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { Playlist } from "../types/Playlist"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "playlist.service.ts"

export const playlistService = {
  getUserPlaylists: async (
    userId: number,
  ): Promise<ApiResponse<Playlist[]>> => {
    try {
      const sql = `
        SELECT 
          p.*, 
          COUNT(pt.music_id) as trackCount,
          (
            SELECT m.image 
            FROM playlisttracks pt2 
            JOIN musics m ON pt2.music_id = m.id 
            WHERE pt2.playlist_id = p.id 
            ORDER BY pt2.id ASC 
            LIMIT 1
          ) as first_track_cover,
          JSON_OBJECT('id', u.id, 'name', u.name, 'surname', u.surname) as user
        FROM playlists p
        LEFT JOIN playlisttracks pt ON p.id = pt.playlist_id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.is_system DESC, p.created_at DESC
      `
      const [rows]: any = await pool.query(sql, [userId])
      return { success: true, data: rows, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur getUserPlaylists: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de récupérer les playlists.",
        },
      }
    }
  },

  createPlaylist: async (
    playlistData: Playlist,
  ): Promise<ApiResponse<{ insertId: number }>> => {
    try {
      const sql = `INSERT INTO playlists (user_id, title, description, cover_image, aleatoire, is_system) VALUES (?, ?, ?, ?, ?, ?)`
      const [result]: any = await pool.query(sql, [
        playlistData.user_id,
        playlistData.title,
        playlistData.description || "",
        playlistData.cover_image || "",
        playlistData.aleatoire ? 1 : 0,
        playlistData.is_system ? 1 : 0,
      ])
      logger(
        playlistData.user_id,
        FILE_NAME,
        "INFO",
        `Playlist "${playlistData.title}" créée (ID: ${result.insertId})`,
      )
      return { success: true, data: { insertId: result.insertId }, error: null }
    } catch (error: any) {
      logger(
        playlistData.user_id || "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur createPlaylist: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_INSERT_ERROR",
          message: "Impossible de créer la playlist.",
        },
      }
    }
  },

  updatePlaylist: async (
    playlistId: number,
    userId: number,
    playlistData: Partial<Playlist>,
  ): Promise<ApiResponse<null>> => {
    try {
      let aleatoireValue = undefined
      if (playlistData.aleatoire !== undefined) {
        aleatoireValue = playlistData.aleatoire ? 1 : 0
      }

      const sql = `
      UPDATE playlists 
      SET 
        title = COALESCE(?, title), 
        description = COALESCE(?, description), 
        cover_image = COALESCE(?, cover_image),
        aleatoire = COALESCE(?, aleatoire)
      WHERE id = ? AND user_id = ?
    `
      const [result]: any = await pool.query(sql, [
        playlistData.title ?? null,
        playlistData.description ?? null,
        playlistData.cover_image ?? null,
        playlistData.aleatoire !== undefined
          ? playlistData.aleatoire
            ? 1
            : 0
          : null,
        playlistId,
        userId,
      ])
      if (result.affectedRows === 0)
        return {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND_OR_UNAUTHORIZED",
            message:
              "Playlist introuvable ou vous n'avez pas l'autorisation de la modifier.",
          },
        }
      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Playlist ${playlistId} mise à jour avec succès`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur updatePlaylist (${playlistId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de modifier cette playlist.",
        },
      }
    }
  },

  updateAleatoirePlaylist: async (
    playlistId: number,
    userId: number,
    playlistData: Partial<Playlist>,
  ): Promise<ApiResponse<null>> => {
    try {
      const [[playlist]]: any = await pool.query(
        `SELECT is_system FROM playlists WHERE id = ?`,
        [playlistId],
      )
      if (playlist?.is_system === 1) {
        return {
          success: false,
          data: null,
          error: {
            code: "SYSTEM_PLAYLIST",
            message: "Cette playlist ne peut pas être modifiée.",
          },
        }
      }

      let aleatoireValue = undefined
      if (playlistData.aleatoire !== undefined) {
        aleatoireValue = playlistData.aleatoire ? 1 : 0
      }

      const sql = `
        UPDATE Playlists 
        SET 
          title = COALESCE(?, title), 
          description = COALESCE(?, description), 
          cover_image = COALESCE(?, cover_image),
          aleatoire = COALESCE(?, aleatoire)
        WHERE id = ? AND user_id = ?
      `
      const [result]: any = await pool.query(sql, [
        playlistData.title ?? null,
        playlistData.description ?? null,
        playlistData.cover_image ?? null,
        aleatoireValue ?? null,
        playlistId,
        userId,
      ])

      if (result.affectedRows === 0)
        return {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND_OR_UNAUTHORIZED",
            message:
              "Playlist introuvable ou vous n'avez pas l'autorisation de la modifier.",
          },
        }

      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Playlist ${playlistId} mise à jour avec succès`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur updatePlaylist (${playlistId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de modifier cette playlist.",
        },
      }
    }
  },

  deletePlaylist: async (
    playlistId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<ApiResponse<null>> => {
    try {
      const [[playlist]]: any = await pool.query(
        `SELECT is_system FROM playlists WHERE id = ?`,
        [playlistId],
      )
      if (playlist?.is_system === 1) {
        return {
          success: false,
          data: null,
          error: {
            code: "SYSTEM_PLAYLIST",
            message: "Cette playlist ne peut pas être supprimée.",
          },
        }
      }

      const sql = isAdmin
        ? `DELETE FROM playlists WHERE id = ?`
        : `DELETE FROM playlists WHERE id = ? AND user_id = ?`
      const params = isAdmin ? [playlistId] : [playlistId, userId]
      const [result]: any = await pool.query(sql, params)
      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND_OR_UNAUTHORIZED",
            message:
              "Playlist introuvable ou vous n'avez pas l'autorisation de la supprimer.",
          },
        }
      }
      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Playlist ${playlistId} supprimée avec succès`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur deletePlaylist (${playlistId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_DELETE_ERROR",
          message: "Impossible de supprimer cette playlist.",
        },
      }
    }
  },

  getPlaylistById: async (
    playlistId: number,
  ): Promise<ApiResponse<Playlist>> => {
    try {
      const sql = `SELECT 
          p.*, 
          COUNT(pt.music_id) as trackCount,
          (
            SELECT m.image 
            FROM playlisttracks pt2 
            JOIN musics m ON pt2.music_id = m.id 
            WHERE pt2.playlist_id = p.id 
            ORDER BY pt2.added_at ASC 
            LIMIT 1
          ) as first_track_cover,
          JSON_OBJECT('id', u.id, 'name', u.name, 'surname', u.surname) as user
        FROM playlists p
        LEFT JOIN playlisttracks pt ON p.id = pt.playlist_id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
        GROUP BY p.id`
      const [rows]: any = await pool.query(sql, [playlistId])
      if (rows.length === 0) {
        return {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Playlist introuvable " + playlistId,
          },
        }
      }
      return { success: true, data: rows[0], error: null }
    } catch (error) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        "Erreur getPlaylistById: " + (error as Error).message,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de récupérer la playlist " + playlistId,
        },
      }
    }
  },

  getAllPlaylists: async (): Promise<ApiResponse<any[]>> => {
    try {
      const sql = `
        SELECT 
          p.*, 
          CONCAT(u.name, ' ', u.surname) as creator_name,
          COALESCE(
            p.cover_image,
            (
              SELECT m.image 
              FROM playlisttracks pt2 
              JOIN musics m ON pt2.music_id = m.id 
              WHERE pt2.playlist_id = p.id 
              ORDER BY pt2.id ASC 
              LIMIT 1
            )
          ) as cover_image
        FROM playlists p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `
      const [rows]: any = await pool.query(sql)
      return { success: true, data: rows, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getAllPlaylists: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de récupérer les playlists.",
        },
      }
    }
  },
}
