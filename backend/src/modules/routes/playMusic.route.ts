import { Router } from "express"
import { getLyricsForTrack, streamMusic } from "../controllers/playMusic.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

router.use(authMiddleware)

router.get("/:id", streamMusic)
router.get("/lyrics/:id", getLyricsForTrack)

export default router