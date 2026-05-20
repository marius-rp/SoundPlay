import { Router } from "express"

import adminSystemRoutes from "./admin/admin-system.route"
import adminUserRoutes from "./admin/admin-user.route"
import adminMusicRoutes from "./admin/admin-music.route"
import adminPlaylistRoutes from "./admin/admin-playlist.route"
import adminProxyRoutes from "./admin/admin-proxy.route"
import { authMiddleware } from "../middlewares/auth.middleware"

const router = Router()

router.use(authMiddleware)

router.use("/system", adminSystemRoutes)

router.use("/users", adminUserRoutes)

router.use("/musics", adminMusicRoutes)

router.use("/playlists", adminPlaylistRoutes)

router.use("/proxy", adminProxyRoutes)

export default router