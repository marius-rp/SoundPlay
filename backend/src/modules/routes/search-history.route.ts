import { Router } from "express"
import { authMiddleware } from "../middlewares/auth.middleware"
import {
  deleteHistory,
  deleteHistoryTerm,
  getHistory,
} from "../controllers/search-history.controller"

const router = Router()

router.use(authMiddleware)

router.get("/history", getHistory)
router.delete("/delete-history", deleteHistory)
router.delete("/delete-term", deleteHistoryTerm)

export default router
