import { Router } from "express";
import {
    createWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    getWorkOrderByNumber,
    updateWorkOrder,
    deleteWorkOrder,
} from "../controllers/workOrderController";
import { verifyToken } from '../Middleware/authMiddleware';
import { verifyPermission } from "../Middleware/verifyPermission";

const router = Router();

router.post("/", verifyToken,createWorkOrder);        // Create (manager+)
router.get("/", verifyToken,getAllWorkOrders);        // Read all (ทุก role ที่ login แล้ว) - supports ?search= or ?workOrderNumber=
router.get("/number/:workOrderNumber", verifyToken,getWorkOrderByNumber);  // Read by workOrderNumber
router.get("/:id", verifyToken,getWorkOrderById);     // Read by ID
router.put("/:id", verifyToken, verifyPermission(["super admin", "admin", "manager"]), updateWorkOrder);      // Update (manager+ หรือ owner)
router.patch("/:id", verifyToken, verifyPermission(["super admin", "admin", "manager"]), updateWorkOrder);      // Update (manager+ หรือ owner)
router.delete("/:id", verifyToken, verifyPermission(["super admin", "admin", "manager"]), deleteWorkOrder);   // Delete (admin+)

export default router;
