import express from 'express';
import {
    createContainer,
    getAllContainers,
    getContainerById,
    updateContainer,
    deleteContainer,
} from '../controllers/containerController';

import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';

const router = express.Router();
router.post('/containers', verifyToken, requirePagePermission(PAGE_PERMISSIONS.CONTAINERS), createContainer);
router.get('/containers', verifyToken, requirePagePermission(PAGE_PERMISSIONS.CONTAINERS), getAllContainers);
router.get('/containers/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.CONTAINERS), getContainerById);
router.patch('/containers/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.CONTAINERS), updateContainer);
router.delete('/containers/:id', verifyToken, requirePagePermission(PAGE_PERMISSIONS.CONTAINERS), deleteContainer);

export default router;
