import express from "express";
import {
    createDataToday,
    updateDataToday,
    deleteDataToday,
    getAllDataToday,
    getDataTodayById,
} from "../controllers/datatodayController";
import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';
import upload from '../Middleware/uploadMiddleware';

const router = express.Router();

//  CREATE (POST)
router.post("/create", verifyToken, requirePagePermission(PAGE_PERMISSIONS.DATA_TODAY), upload.single('booking_image'), createDataToday);
//  READ ALL
router.get("/", verifyToken, requirePagePermission(PAGE_PERMISSIONS.DATA_TODAY), getAllDataToday);

//  READ BY ID
router.get("/:id", verifyToken, requirePagePermission(PAGE_PERMISSIONS.DATA_TODAY), getDataTodayById);

//  UPDATE (PATCH)
router.patch("/update/:id", verifyToken, requirePagePermission(PAGE_PERMISSIONS.DATA_TODAY), upload.single('booking_image'), updateDataToday);

//  DELETE (DELETE)
router.delete("/delete/:id", verifyToken, requirePagePermission(PAGE_PERMISSIONS.DATA_TODAY), deleteDataToday);

export default router;
