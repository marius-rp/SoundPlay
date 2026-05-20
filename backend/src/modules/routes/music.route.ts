import { Router } from "express"
import { getMusicById } from "../controllers/music.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

router.use(authMiddleware)

router.get("/getMusicById/:id", getMusicById)

export default router
