import { Router } from "express";
import { getRolesList } from "../controllers/role.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router()

router.use(authMiddleware)

router.get("/all-roles", getRolesList)

export default router