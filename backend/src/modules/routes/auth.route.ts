import { Router } from "express"
import {
  signUp,
  signIn,
  getMe,
  logout,
  deleteMe,
  changePassword,
  requestEmailVerification,
  verifyEmail,
} from "../controllers/auth.controller"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

router.get("/me", authMiddleware, getMe)
router.post("/sign-up", signUp)
router.post("/sign-in", signIn)
router.post("/logout", logout)
router.put("/change-password", authMiddleware, changePassword)
router.delete("/delete-account", authMiddleware, deleteMe)
router.post("/request-email", authMiddleware, requestEmailVerification)
router.get("/verify-email", verifyEmail)

export default router
