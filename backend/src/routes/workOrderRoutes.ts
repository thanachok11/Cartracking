import { Router } from "express";
import {
    createWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    updateWorkOrder,
    deleteWorkOrder,
} from "../controllers/workOrderController";
import { verifyToken } from '../Middleware/authMiddleware';

const router = Router();

router.post("/", verifyToken,createWorkOrder);        // Create (manager+)
router.get("/", verifyToken,getAllWorkOrders);        // Read all (ทุก role ที่ login แล้ว)
router.get("/:id", verifyToken,getWorkOrderById);     // Read by ID
router.put("/:id", verifyToken,updateWorkOrder);      // Update (manager+ หรือ owner)
router.patch("/:id", verifyToken, updateWorkOrder);      // Update (manager+ หรือ owner)
router.delete("/:id", verifyToken,deleteWorkOrder);   // Delete (admin+)

export default router;
