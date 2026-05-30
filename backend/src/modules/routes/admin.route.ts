import { Router } from "express"

import adminSystemRoutes from "./admin/admin-system.route"
import adminUserRoutes from "./admin/admin-user.route"
import adminMusicRoutes from "./admin/admin-music.route"
import adminPlaylistRoutes from "./admin/admin-playlist.route"
import adminProxyRoutes from "./admin/admin-proxy.route"
import { authMiddleware } from "../middlewares/auth.middleware"
import { ROLES } from "../../constant"
import { authorizeRoles } from "../middlewares/roleMiddleware"

const router = Router()

router.use(authMiddleware)

router.use("/system", authorizeRoles([ROLES.ADMIN, ROLES.SUPERVISOR]), adminSystemRoutes)

router.use("/users", authorizeRoles([ROLES.ADMIN]), adminUserRoutes)

router.use("/musics", authorizeRoles([ROLES.ADMIN]), adminMusicRoutes)

router.use("/playlists", authorizeRoles([ROLES.ADMIN]), adminPlaylistRoutes)

router.use("/proxy", authorizeRoles([ROLES.ADMIN, ROLES.SUPERVISOR]), adminProxyRoutes)

export default router