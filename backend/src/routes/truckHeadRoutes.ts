import express from 'express';
import {
    createTruckHead,
    getAllTruckHeads,
    getTruckHeadById,
    updateTruckHead,
    deleteTruckHead,
} from '../controllers/truckHeadController';

import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

router.post('/truck-heads', verifyToken, createTruckHead);
router.get('/truck-heads', verifyToken, getAllTruckHeads);
router.get('/truck-heads/:id', verifyToken, getTruckHeadById);
router.patch('/truck-heads/:id', verifyToken, updateTruckHead);
router.delete('/truck-heads/:id', verifyToken, deleteTruckHead);

export default router;
