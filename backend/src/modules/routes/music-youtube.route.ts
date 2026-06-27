import { Router } from "express"
import rateLimit from "express-rate-limit"
import {
  getPreview,
  searchMusic,
  downloadMusic,
  cancelDownload,
  getTrendingTracks,
} from "../controllers/music-youtube.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: "Trop de recherches, ralentis un peu." },
})

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 65,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de téléchargements lancés. Patiente un peu.",
  },
})

const previewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_PREVIEWS",
      message: "Tu écoutes trop d'extraits, fais une pause !",
    },
  },
})

router.use(authMiddleware)

router.get("/search", searchLimiter, searchMusic)
router.get("/download/:id", downloadLimiter, downloadMusic)
router.get("/preview/:id", previewLimiter, getPreview)
router.get("/trending/tracks", getTrendingTracks)
router.post("/cancel/:id", cancelDownload)

export default router
