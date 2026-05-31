import { Router } from "express"
import { getMusicsList, updateMusic, deleteMusic, cleanOrphanedMusics } from "../../controllers/admin/admin-music.controller"

const router = Router()

router.get("/getAllMusics", getMusicsList)
router.put("/updateMusic/:id", updateMusic)
router.delete("/deleteMusic/:id", deleteMusic)
router.delete("/cleanOrphaned", cleanOrphanedMusics)

export default router
