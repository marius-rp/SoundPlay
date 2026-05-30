import { Router } from "express"
import { getProxies, createProxy, removeProxy, runProxyTest, toggleProxy, uploadProxyCsv, runAllProxiesTest, updateProxy } from "../../controllers/proxy.controller"
import { uploadProxyCsvMiddleware } from "../../middlewares/upload.middleware"

const router = Router()

router.get("/getAllProxies", getProxies)
router.post("/addProxy", createProxy)
router.delete("/deleteProxy/:id", removeProxy)
router.post("/testProxy/:id", runProxyTest)
router.put("/toggleProxy/:id", toggleProxy)
router.post("/uploadProxyCsv", uploadProxyCsvMiddleware.single("file"), uploadProxyCsv)
router.post("/testAllProxies", runAllProxiesTest)
router.put("/updateProxy/:id", updateProxy)

export default router