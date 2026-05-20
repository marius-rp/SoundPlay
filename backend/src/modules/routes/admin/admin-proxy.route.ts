import { Router } from "express"
import { getProxies, createProxy, removeProxy, runProxyTest, toggleProxy } from "../../controllers/proxy.controller"

const router = Router()

router.get("/getAllProxies", getProxies)
router.post("/addProxy", createProxy)
router.delete("/deleteProxy/:id", removeProxy)
router.post("/testProxy/:id", runProxyTest)
router.put("/toggleProxy/:id", toggleProxy)

export default router