import express from "express";
import { createUser, updateUser, updateStatus, deleteUser } from "../controllers/userController";
import { checkPermission } from "../Middleware/checkPermission";
import { verifyToken } from '../Middleware/authMiddleware';
import upload from '../Middleware/uploadMiddleware'; // นำเข้า middleware สำหรับอัปโหลดไฟล์

const router = express.Router();

// สร้าง user → ตรวจสิทธิ์ก่อน
router.post("/create", checkPermission("create"), createUser);

// อัปเดต user → ตรวจสิทธิ์ก่อน
router.patch(
    "/update",
    verifyToken,                 // ← ตรวจ JWT ก่อน
    upload.single('image'),      // ← parse form-data
    checkPermission("update"),   // ← ตอนนี้ req.body และ req.user มีครบ
    updateUser
);

router.patch(
    "/update-status",
    verifyToken,
    checkPermission("update"),
    updateStatus
);


// ลบ user → ตรวจสิทธิ์ก่อน
router.delete("/delete", verifyToken, checkPermission("delete"), deleteUser);

export default router;
