import express from 'express';
import {
    createContainer,
    getAllContainers,
    getContainerById,
    updateContainer,
    deleteContainer,
} from '../controllers/containerController';

import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

router.post('/drivers', verifyToken, createContainer);
router.get('/drivers', getAllContainers);
router.get('/drivers/:id', verifyToken, getContainerById);
router.patch('/drivers/:id', verifyToken, updateContainer);
router.delete('/drivers/:id', verifyToken, deleteContainer);

export default router;
