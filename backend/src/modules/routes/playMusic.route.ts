import { Router } from "express"
import { streamMusic } from "../controllers/playMusic.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

router.use(authMiddleware)

router.get("/:id", streamMusic)

export default router