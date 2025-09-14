import express from 'express';
import {
    createTruckHead,
    getAllTruckHeads,
    getTruckHeadById,
    updateTruckHead,
    deleteTruckHead,
} from '../controllers/truckHeadController';

import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';

const router = express.Router();

router.post('/truck-heads', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), createTruckHead);
router.get('/truck-heads', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), getAllTruckHeads);
router.get('/truck-heads/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), getTruckHeadById);
router.patch('/truck-heads/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), updateTruckHead);
router.delete('/truck-heads/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), deleteTruckHead);

export default router;
