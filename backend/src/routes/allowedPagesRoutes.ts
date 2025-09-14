import express from "express";
import {
    getAllowedPages,
    updateAllowedPages
} from "../controllers/allowedPagesController";
import { checkPermission } from "../Middleware/checkPermission";
import { verifyToken } from '../Middleware/authMiddleware';
import { checkPagePermission } from "../Middleware/checkPermission";

const router = express.Router();

//  Admin/super admin อัปเดต allowedPages ให้ user ได้
router.put(
    "/update",
    verifyToken,
    checkPermission("update"),
    updateAllowedPages
);

//  เช็คสิทธิ์เข้าหน้า (optional ใช้กรณีต้องการ validate หน้าเดียว)
router.get("/check-page", checkPagePermission, (req, res) => {
    res.json({ message: "Allowed" });
});


export default router;
