import express from "express";
import { createUser, updateUser, updateStatus, deleteUser } from "../controllers/userController";
import { checkPermission } from "../Middleware/checkPermission";
import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';
import upload from '../Middleware/uploadMiddleware'; // นำเข้า middleware สำหรับอัปโหลดไฟล์

const router = express.Router();

// สร้าง user → ตรวจสิทธิ์ก่อน
router.post("/create", verifyToken, requirePagePermission(PAGE_PERMISSIONS.USER_MANAGEMENT), checkPermission("create"), createUser);

// อัปเดต user → ตรวจสิทธิ์ก่อน
router.patch(
    "/update",
    verifyToken,                 // ← ตรวจ JWT ก่อน
    requirePagePermission(PAGE_PERMISSIONS.USER_MANAGEMENT),  // ← ตรวจ page permission
    upload.single('image'),      // ← parse form-data
    checkPermission("update"),   // ← ตอนนี้ req.body และ req.user มีครบ
    updateUser
);

router.patch(
    "/update-status",
    verifyToken,
    requirePagePermission(PAGE_PERMISSIONS.USER_MANAGEMENT),
    checkPermission("update"),
    updateStatus
);


// ลบ user → ตรวจสิทธิ์ก่อน
router.delete("/delete", verifyToken, requirePagePermission(PAGE_PERMISSIONS.USER_MANAGEMENT), checkPermission("delete"), deleteUser);

export default router;
