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

router.post('/containers', verifyToken, createContainer);
router.get('/containers', verifyToken, getAllContainers);
router.get('/containers/:id', verifyToken, getContainerById);
router.patch('/containers/:id', verifyToken, updateContainer);
router.delete('/containers/:id', verifyToken, deleteContainer);

export default router;
