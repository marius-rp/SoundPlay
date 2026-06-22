import { Request, Response } from "express"
import fs from "fs"
import { playMusicService } from "../services/playMusic.service"
import { lyricsService } from "../services/lyrics.service"
import { logger } from "../../utils/logger.helper"

const FILE_NAME = "playMusic.controller.ts"

export const streamMusic = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const musicId = req.params.id
    if (!musicId) {
      return res.status(400).send("ID de musique manquant.")
    }
    const filePath = await playMusicService.getMusicFilePath(musicId as string)
    if (!filePath) {
      return res.status(404).send("Fichier audio introuvable.")
    }
    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const CHUNK_SIZE = 10 ** 6 // 1 MB
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : Math.min(start + CHUNK_SIZE, fileSize - 1)
      const chunksize = end - start + 1
      const fileStream = fs.createReadStream(filePath, { start, end })
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "audio/mpeg",
      }
      res.writeHead(206, head)
      fileStream.pipe(res)
      fileStream.on("error", (err) => {
        logger(
          userId,
          FILE_NAME,
          "ERROR",
          `Erreur flux de lecture: ${err.message}`,
        )
        res.end()
      })
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      }
      res.writeHead(200, head)
      fs.createReadStream(filePath).pipe(res)
    }
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur critique streamMusic: ${error.message}`,
    )
    if (!res.headersSent) {
      res.status(500).send("Erreur interne du serveur.")
    }
  }
}

export const getLyricsForTrack = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || "SYSTEM"
  try {
    const musicId = req.params.id
    if (!musicId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: "MISSING_ID", message: "ID de musique manquant." },
      })
    }

    const result = await lyricsService.getLyricsByMusicId(String(musicId))

    if (!result) {
      logger(
        userId,
        FILE_NAME,
        "INFO",
        `Aucune parole disponible pour music_id: ${musicId}`,
      )
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: "LYRICS_NOT_FOUND",
          message: "Aucune parole disponible pour ce titre.",
        },
      })
    }

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    })
  } catch (error: any) {
    logger(
      userId,
      FILE_NAME,
      "ERROR",
      `Erreur critique getLyricsForTrack: ${error.message}`,
    )
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: "SERVER_ERROR", message: "Erreur interne du serveur." },
    })
  }
}
