import express from 'express';
import { loginContainers,renewCookie } from '../controllers/logincontainersController';
import { trackContainers } from '../controllers/trackcontainerController';
import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';

const router = express.Router();
router.post('/renewCookie', verifyToken, requirePagePermission(PAGE_PERMISSIONS.TRACK_CONTAINER), renewCookie);
router.post('/loginContainers', verifyToken, requirePagePermission(PAGE_PERMISSIONS.TRACK_CONTAINER), loginContainers);
router.get('/trackContainers', verifyToken, requirePagePermission(PAGE_PERMISSIONS.TRACK_CONTAINER), trackContainers);

export default router;
