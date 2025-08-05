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

router.post('/drivers', verifyToken, createDriver);
router.get('/drivers', verifyToken,getAllDrivers);
router.get('/drivers/:id', verifyToken, getDriverById);
router.patch('/drivers/:id', verifyToken, updateDriver);
router.delete('/drivers/:id', verifyToken, deleteDriver);

export default router;
