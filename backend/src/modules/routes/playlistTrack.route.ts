import { Router } from "express"
import {
  addTrackToPlaylist,
  checkTrackInPlaylist,
  getPlaylistTracks,
  removeTrackFromPlaylist,
} from "../controllers/playlistTrack.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

router.use(authMiddleware)

router.get("/get-tracks/:playlistId", getPlaylistTracks)

router.get("/check/:playlistId/:musicId", checkTrackInPlaylist)

router.post("/add-tracks/:playlistId", addTrackToPlaylist)

router.delete(
  "/delete-tracks/:playlistId/:musicId",
  removeTrackFromPlaylist,
)

export default router
