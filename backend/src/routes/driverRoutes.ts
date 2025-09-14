import express from 'express';
import {
    createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
} from '../controllers/driverController';

import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';
import upload from '../Middleware/uploadMiddleware'; // นำเข้า middleware สำหรับอัปโหลดไฟล์

const router = express.Router();

router.post('/driver/create', verifyToken, requirePagePermission(PAGE_PERMISSIONS.DRIVERS), upload.single('image'), createDriver);
router.get('/driver', verifyToken, requirePagePermission(PAGE_PERMISSIONS.DRIVERS), getAllDrivers);
router.get('/driver/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.DRIVERS), getDriverById);
router.patch('/driver/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.DRIVERS), upload.single('image'), updateDriver);
router.delete('/driver/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.DRIVERS), deleteDriver);

export default router;
