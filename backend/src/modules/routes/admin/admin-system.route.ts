import { Router } from "express"
import { getStats, getLogs, clearCache, clearPreviews, getDownloadSettings, updateDownloadSetting, updateBinaries } from "../../controllers/admin/admin-system.controller"

const router = Router()

router.get("/getAllStats", getStats)
router.get("/getLogs", getLogs)

router.post("/clearCache", clearCache)
router.post("/clearPreviews", clearPreviews)

router.get("/getDownloadSettings", getDownloadSettings)
router.put("/updateDownloadSetting", updateDownloadSetting)
router.post("/updateBinarie", updateBinaries)

export default router