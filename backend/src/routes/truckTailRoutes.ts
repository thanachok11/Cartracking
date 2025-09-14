import express from 'express';
import {
    createTruckTail,
    getAllTruckTails,
    getTruckTailById,
    updateTruckTail,
    deleteTruckTail,
} from '../controllers/truckTailController';

import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';

const router = express.Router();

router.post('/truck-tails', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES_TAIL), createTruckTail);
router.get('/truck-tails', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES_TAIL), getAllTruckTails);
router.get('/truck-tails/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES_TAIL), getTruckTailById);
router.patch('/truck-tails/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES_TAIL), updateTruckTail);
router.delete('/truck-tails/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES_TAIL), deleteTruckTail);

export default router;
