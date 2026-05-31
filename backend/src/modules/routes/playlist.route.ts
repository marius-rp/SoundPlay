import { Router } from "express"
import {
  createPlaylist,
  updatePlaylist,
  updateAleatoirePlaylist,
  deletePlaylist,
  getUserPlaylists,
  getPlaylistById,
  importCsvToPlaylist,
} from "../controllers/playlist.controller"
import { authMiddleware } from "../middlewares/auth.middleware"
import { uploadCoverMiddleware, uploadMusicCsvMiddleware } from "../middlewares/upload.middleware"

const router = Router()

router.use(authMiddleware)

router.get("/userPlaylists", getUserPlaylists)
router.get("/playlistById/:id", getPlaylistById)
router.post("/create", createPlaylist)
router.post("/:id/import-csv", uploadMusicCsvMiddleware.single("file"), importCsvToPlaylist)
router.put(
  "/update/:id",
  uploadCoverMiddleware.single("cover"),
  updatePlaylist,
)
router.put("/updateAleatoire/:id", updateAleatoirePlaylist)
router.delete("/delete/:id", deletePlaylist)

export default router
