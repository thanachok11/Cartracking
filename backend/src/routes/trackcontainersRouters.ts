import express from 'express';
import { loginContainers,renewCookie } from '../controllers/logincontainersController';
import { trackContainers } from '../controllers/trackcontainerController';

const router = express.Router();
router.post('/renewCookie', renewCookie);
router.post('/loginContainers', loginContainers);
router.get('/trackContainers', trackContainers);

export default router;
