import { Router } from "express";
import {
    createWorkOrder,
    getAllWorkOrders,
    getWorkOrderById,
    getWorkOrderByNumber,
    updateWorkOrder,
    deleteWorkOrder,
    confirmWorkOrders,   // ✅ เพิ่ม
    downloadWorkOrderTemplate
} from "../controllers/workOrderController";
import { verifyToken } from '../Middleware/authMiddleware';
import { verifyPermission } from "../Middleware/verifyPermission";
import upload from "../Middleware/uploadexcelMiddleware";

const router = Router();

router.post("/", verifyToken, createWorkOrder);
router.get("/", verifyToken, getAllWorkOrders);
router.get("/number/:workOrderNumber", verifyToken, getWorkOrderByNumber);
router.get(
    "/template/:lang",
    verifyToken,
    verifyPermission(["super admin", "admin", "manager"]),
    downloadWorkOrderTemplate
);
router.get("/:id", verifyToken, getWorkOrderById);
router.put("/:id", verifyToken, verifyPermission(["super admin", "admin", "manager"]), updateWorkOrder);
router.patch("/:id", verifyToken, verifyPermission(["super admin", "admin", "manager"]), updateWorkOrder);
router.delete("/:id", verifyToken, verifyPermission(["super admin", "admin", "manager"]), deleteWorkOrder);

router.post(
    "/import",
    verifyToken,
    verifyPermission(["manager", "admin", "super admin"]),
    upload.single("file"),
    confirmWorkOrders
);

export default router;
