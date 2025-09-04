import express from 'express';
import {
    createTruckTail,
    getAllTruckTails,
    getTruckTailById,
    updateTruckTail,
    deleteTruckTail,
} from '../controllers/truckTailController';

import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

router.post('/truck-tails', verifyToken, createTruckTail);
router.get('/truck-tails', verifyToken, getAllTruckTails);
router.get('/truck-tails/:id', verifyToken, getTruckTailById);
router.patch('/truck-tails/:id', verifyToken, updateTruckTail);
router.delete('/truck-tails/:id', verifyToken, deleteTruckTail);

export default router;
