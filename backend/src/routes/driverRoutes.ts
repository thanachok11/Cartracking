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
router.get('/vehicles/drivers', verifyToken,getAllDrivers);
router.get('/vehicles/drivers/:id', verifyToken, getDriverById);
router.patch('/vehicles/drivers/:id', verifyToken, updateDriver);
router.delete('/vehicles/drivers/:id', verifyToken, deleteDriver);

export default router;
