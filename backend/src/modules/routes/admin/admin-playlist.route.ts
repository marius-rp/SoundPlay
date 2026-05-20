import { Router } from "express"
import { getPlaylistsList } from "../../controllers/admin/admin-playlist.controller"
import { deletePlaylist, updatePlaylist } from "../../controllers/playlist.controller"
import { uploadCoverMiddleware } from "../../middlewares/upload.middleware"

const router = Router()

router.get("/getAllPlaylists", getPlaylistsList)
router.put("/updatePlaylist/:id", uploadCoverMiddleware.single("coverFile"), updatePlaylist)
router.delete("/deletePlaylist/:id", deletePlaylist)

export default router