import express from "express";
import { createUser, updateUser, deleteUser } from "../controllers/userController";
import { checkPermission } from "../Middleware/checkPermission";

const router = express.Router();

// สร้าง user → ตรวจสิทธิ์ก่อน
router.post("/create", checkPermission("create"), createUser);

// อัปเดต user → ตรวจสิทธิ์ก่อน
router.patch("/update", checkPermission("update"), updateUser);

// ลบ user → ตรวจสิทธิ์ก่อน
router.delete("/delete", checkPermission("delete"), deleteUser);

export default router;
