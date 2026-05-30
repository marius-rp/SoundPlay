import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import path from "path"

import { connectDB } from "./modules/config/db"
import AuthRouter from "./modules/routes/auth.route"
import MusicYoutubeRouter from "./modules/routes/music-youtube.route"
import MusicRouter from "./modules/routes/music.route"
import PlaylistRouter from "./modules/routes/playlist.route"
import PlaylistTrackRouter from "./modules/routes/playlistTrack.route"
import SearchHistoryRouter from "./modules/routes/search-history.route"
import adminRoutes from "./modules/routes/admin.route"
import roleRoutes from "./modules/routes/role.route"
import { logger } from "./utils/logger.helper"
import PlayMusicRouter from "./modules/routes/playMusic.route"

dotenv.config()

const FILE_NAME = "server.ts"
const app = express()
const PORT = process.env.PORT

app.use(
  cors({
    origin: process.env.NODE_FRONTEND,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())
app.use(cookieParser())

app.use("/storage", express.static(path.join(process.cwd(), "storage")))

app.use("/api/auth", AuthRouter)
app.use("/api/music-youtube", MusicYoutubeRouter)
app.use("/api/music", MusicRouter)
app.use("/api/playlist", PlaylistRouter)
app.use("/api/playlist-tracks", PlaylistTrackRouter)
app.use("/api/search-history", SearchHistoryRouter)
app.use("/api/admin", adminRoutes)
app.use("/api/role", roleRoutes)
app.use("/api/playMusic", PlayMusicRouter)


app.get("/", (req, res) => {
  res.json({ message: "Serveur SoundPlay en ligne !" })
})

const startServer = async () => {
  try {
    await connectDB()

    app.listen(PORT, () => {
      logger(
        "SYSTEM",
        FILE_NAME,
        "INFO",
        `Serveur SoundPlay démarré sur le port ${PORT}`,
      )

      console.log(`[SoundPlay]: Server is running on port ${PORT}`)
    })
  } catch (error: any) {
    logger(
      "SYSTEM",
      FILE_NAME,
      "ERROR",
      `Échec du démarrage du serveur : ${error.message}`,
    )
    process.exit(1)
  }
}

startServer()