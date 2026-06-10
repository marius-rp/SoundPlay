import { Router } from "express"
import { getUsersList, createUser, updateUser, deleteUser, updateUserStatus } from "../../controllers/admin/admin-user.controller"

const router = Router()

router.get("/getAllUsers", getUsersList)
router.post("/createUser", createUser)
router.put("/updateUser/:id", updateUser)
router.patch("/updateStatus/:id", updateUserStatus) 
router.delete("/deleteUser/:id", deleteUser)

export default router