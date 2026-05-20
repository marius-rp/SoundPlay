import fs from "fs"
import path from "path"
import pool from "../config/db"
import { ApiResponse } from "../types/ApiResponse"
import { Track } from "../types/Music"
import { logger } from "../../utils/logger.helper"
import { LINK_FILES_MUSICS } from "../../constant"

const FILE_NAME = "music.service.ts"
const STORAGE_PATH = path.join(process.cwd(), LINK_FILES_MUSICS)
const PREVIEW_CACHE_PATH = path.join(process.cwd(), "cache_previews")

export const musicService = {
  saveMusic: async (music: Track): Promise<ApiResponse<null>> => {
    try {
      const sql = `INSERT IGNORE INTO musics (id, title, artist, image, duration) VALUES (?, ?, ?, ?, ?)`
      await pool.query(sql, [
        music.id,
        music.title,
        music.artist,
        music.image,
        music.duration,
      ])
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Musique synchronisée en BDD : ${music.title} (${music.id})`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur SQL saveMusic: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_INSERT_ERROR",
          message: "Impossible d'enregistrer la musique en base de données.",
        },
      }
    }
  },

  getMusicById: async (id: string): Promise<ApiResponse<Track>> => {
    try {
      const sql = `SELECT * FROM musics WHERE id = ?`
      const [rows]: any = await pool.query(sql, [id])
      if (rows.length === 0)
        return {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "Musique non trouvée" },
        }
      return { success: true, data: rows[0], error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur SQL getMusicById (${id}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Erreur lors de la récupération de la musique.",
        },
      }
    }
  },

  getAllMusics: async (): Promise<ApiResponse<any[]>> => {
    try {
      const sql = `SELECT * FROM musics ORDER BY title ASC`
      const [rows]: any = await pool.query(sql)
      return { success: true, data: rows, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur getAllMusics: ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_SELECT_ERROR",
          message: "Impossible de récupérer les musiques.",
        },
      }
    }
  },

  updateMusic: async (
    musicId: string,
    data: { title: string; artist: string; image: string },
  ): Promise<ApiResponse<null>> => {
    try {
      const { title, artist, image } = data
      const sql = `UPDATE musics SET title = ?, artist = ?, image = ? WHERE id = ?`
      const [result]: any = await pool.query(sql, [
        title,
        artist,
        image,
        musicId,
      ])

      if (result.affectedRows === 0) {
        return {
          success: false,
          data: null,
          error: {
            code: "MUSIC_NOT_FOUND",
            message: "Musique non trouvée ou aucune modification effectuée.",
          },
        }
      }
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Musique ID ${musicId} mise à jour (Titre: ${title})`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur updateMusic (${musicId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DB_UPDATE_ERROR",
          message: "Impossible de mettre à jour la musique.",
        },
      }
    }
  },

  deleteMusic: async (musicId: string): Promise<ApiResponse<null>> => {
    try {
      await pool.query(`DELETE FROM playlisttracks WHERE music_id = ?`, [
        musicId,
      ])
      await pool.query(`DELETE FROM musics WHERE id = ?`, [musicId])

      const storageFilePath = path.join(STORAGE_PATH, `${musicId}.mp3`)
      const previewPathMp3 = path.join(PREVIEW_CACHE_PATH, `${musicId}.mp3`)
      const previewPathM4a = path.join(PREVIEW_CACHE_PATH, `${musicId}.m4a`)

      if (fs.existsSync(storageFilePath)) {
        fs.unlinkSync(storageFilePath)
        logger(
          "SYSTEM",
          FILE_NAME,
          "LOG",
          `Fichier storage supprimé: ${musicId}.mp3`,
        )
      }
      if (fs.existsSync(previewPathMp3)) {
        fs.unlinkSync(previewPathMp3)
        logger(
          "SYSTEM",
          FILE_NAME,
          "LOG",
          `Fichier preview mp3 supprimé: ${musicId}.mp3`,
        )
      }
      if (fs.existsSync(previewPathM4a)) {
        fs.unlinkSync(previewPathM4a)
        logger(
          "SYSTEM",
          FILE_NAME,
          "LOG",
          `Fichier preview m4a supprimé: ${musicId}.m4a`,
        )
      }

      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Musique ${musicId} totalement supprimée (BDD + Fichiers)`,
      )
      return { success: true, data: null, error: null }
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur deleteMusic (${musicId}): ${error.message}`,
      )
      return {
        success: false,
        data: null,
        error: {
          code: "DELETE_ERROR",
          message: "Impossible de supprimer complètement la musique.",
        },
      }
    }
  },
}
