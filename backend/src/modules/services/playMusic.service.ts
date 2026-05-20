import fs from "fs"
import path from "path"
import { LINK_FILES_MUSICS } from "../../constant"
import { musicService } from "./music.service"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "playMusic.service.ts"
const STORAGE_PATH = path.join(process.cwd(), LINK_FILES_MUSICS)

export const playMusicService = {
  getMusicFilePath: async (musicId: string): Promise<string | null> => {
    try {
      const trackRes = await musicService.getMusicById(musicId)
      if (!trackRes.success || !trackRes.data) {
        return null
      }

      const filePath = path.join(STORAGE_PATH, `${musicId}.mp3`)

      if (fs.existsSync(filePath)) {
        return filePath
      }
      
      const m4aPath = path.join(STORAGE_PATH, `${musicId}.m4a`)
      if (fs.existsSync(m4aPath)) {
        return m4aPath
      }

      return null
    } catch (error: any) {
      logger(
        "SYSTEM",
        FILE_NAME,
        "ERROR",
        `Erreur chemin fichier: ${error.message}`,
      )
      return null
    }
  },
}
