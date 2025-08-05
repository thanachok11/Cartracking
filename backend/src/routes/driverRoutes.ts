import express from 'express';
import {
    createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
} from '../controllers/driverController';

import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();
router.post('/driver/create', verifyToken, createDriver);
router.get('/driver', verifyToken,getAllDrivers);
router.get('/driver/:id', verifyToken, getDriverById);
router.patch('/driver/:id', verifyToken, updateDriver);
router.delete('/driver/:id', verifyToken, deleteDriver);

export default router;
