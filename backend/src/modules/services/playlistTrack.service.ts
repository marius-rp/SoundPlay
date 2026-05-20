import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { IPlaylistTrackDetails } from "../types/PlaylistTrack"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "playlistTrack.service.ts"

export const playlistTrackService = {
  addTrackToPlaylist: async (
    playlistId: number,
    musicId: string,
    userId: number,
  ): Promise<ApiResponse<null>> => {
    try {
      const checkSql = `SELECT id FROM playlists WHERE id = ? AND user_id = ?`
      const [checkResult]: any = await pool.query(checkSql, [
        playlistId,
        userId,
      ])

      if (checkResult.length === 0) {
        logger(
          userId,
          FILE_NAME,
          "WARN",
          `Tentative d'ajout illégale: Playlist ${playlistId} non trouvée ou non autorisée`,
        )
        return {
          success: false,
          data: null,
          error: {
            code: "UNAUTHORIZED_OR_NOT_FOUND",
            message:
              "Playlist introuvable ou vous n'en êtes pas le propriétaire.",
          },
        }
      }

      const positionSql = `SELECT COALESCE(MAX(position), 0) + 1 as nextPosition FROM playlisttracks WHERE playlist_id = ?`
      const [posResult]: any = await pool.query(positionSql, [playlistId])
      const nextPosition = posResult[0].nextPosition

      const insertSql = `
        INSERT INTO playlisttracks (playlist_id, music_id, position)
        VALUES (?, ?, ?)
      `
      await pool.query(insertSql, [playlistId, musicId, nextPosition])

      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Musique ${musicId} ajoutée à la playlist ${playlistId} (pos: ${nextPosition})`,
      )

      return { success: true, data: null, error: null }
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        logger(
          userId,
          FILE_NAME,
          "LOG",
          `Doublon ignoré : Musique ${musicId} déjà dans playlist ${playlistId}`,
        )
        return {
          success: false,
          data: null,
          error: {
            code: "DUPLICATE_TRACK",
            message: "Cette musique est déjà présente.",
          },
        }
      }

      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur addTrackToPlaylist: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_INSERT_ERROR",
          message: "Impossible d'ajouter la musique.",
        },
      }
    }
  },

  getPlaylistTracks: async (
    playlistId: number,
    userId: number,
  ): Promise<ApiResponse<IPlaylistTrackDetails[]>> => {
    try {
      const checkSql = `SELECT id FROM playlists WHERE id = ? AND user_id = ?`
      const [checkResult]: any = await pool.query(checkSql, [
        playlistId,
        userId,
      ])

      if (checkResult.length === 0) {
        logger(
          userId,
          FILE_NAME,
          "WARN",
          `Accès refusé pistes playlist ${playlistId}`,
        )
        return {
          success: false,
          data: null,
          error: {
            code: "UNAUTHORIZED_OR_NOT_FOUND",
            message: "Accès refusé à cette playlist.",
          },
        }
      }

      const sql = `
        SELECT m.*, pt.id as track_id, pt.playlist_id, pt.position, pt.added_at
        FROM playlisttracks pt
        JOIN musics m ON pt.music_id = m.id
        WHERE pt.playlist_id = ?
        ORDER BY pt.position ASC
      `
      const [rows]: any = await pool.query(sql, [playlistId])

      return {
        success: true,
        data: rows as IPlaylistTrackDetails[],
        error: null,
      }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur getPlaylistTracks: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: { code: "DB_SELECT_ERROR", message: "Erreur de récupération." },
      }
    }
  },

  removeTrackFromPlaylist: async (
    playlistId: number,
    musicId: string,
    userId: number,
  ): Promise<ApiResponse<null>> => {
    try {
      const checkSql = `SELECT id FROM playlists WHERE id = ? AND user_id = ?`
      const [checkResult]: any = await pool.query(checkSql, [
        playlistId,
        userId,
      ])

      if (checkResult.length === 0) {
        logger(
          userId,
          FILE_NAME,
          "WARN",
          `Tentative retrait illégale playlist ${playlistId}`,
        )
        return {
          success: false,
          data: null,
          error: {
            code: "UNAUTHORIZED_OR_NOT_FOUND",
            message: "Action non autorisée.",
          },
        }
      }

      const sql = `DELETE FROM playlisttracks WHERE playlist_id = ? AND music_id = ?`
      const [result]: any = await pool.query(sql, [playlistId, musicId])

      if (result.affectedRows === 0) {
        logger(
          userId,
          FILE_NAME,
          "LOG",
          `Musique ${musicId} non trouvée dans playlist ${playlistId} lors du retrait`,
        )
        return {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Cette musique ne se trouve pas dans la playlist.",
          },
        }
      }

      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Musique ${musicId} retirée de la playlist ${playlistId}`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        userId,
        FILE_NAME,
        "ERROR",
        `Erreur removeTrackFromPlaylist: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_DELETE_ERROR",
          message: "Impossible de retirer la musique.",
        },
      }
    }
  },

  checkTrackInPlaylist: async (
    playlistId: number,
    musicId: string,
  ): Promise<ApiResponse<boolean>> => {
    try {
      const sql = `SELECT id FROM playlisttracks WHERE playlist_id = ? AND music_id = ?`
      const [rows]: any = await pool.query(sql, [playlistId, musicId])

      return {
        success: true,
        data: rows.length > 0,
        error: null,
      }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur checkTrackInPlaylist: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de vérifier le doublon.",
        },
      }
    }
  },
}
