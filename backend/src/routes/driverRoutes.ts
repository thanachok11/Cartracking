import express from 'express';
import {
    createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
} from '../controllers/driverController';

import { verifyToken } from '../Middleware/authMiddleware';
import upload from '../Middleware/uploadMiddleware'; // นำเข้า middleware สำหรับอัปโหลดไฟล์

const router = express.Router();

router.post('/driver/create', verifyToken, upload.single('image'), createDriver);
router.get('/driver', verifyToken,getAllDrivers);
router.get('/driver/:id', verifyToken, getDriverById);
router.patch('/driver/:id', verifyToken, upload.single('image'), updateDriver);
router.delete('/driver/:id', verifyToken, deleteDriver);

export default router;
