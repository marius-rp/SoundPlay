import { Router } from "express"
import { getMusicsList, updateMusic, deleteMusic } from "../../controllers/admin/admin-music.controller"

const router = Router()

router.get("/getAllMusics", getMusicsList)
router.put("/updateMusic/:id", updateMusic)
router.delete("/deleteMusic/:id", deleteMusic)

export default router
