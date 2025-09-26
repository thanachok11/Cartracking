import express from 'express';
import {
    login,
    register,
    showAllUsers,
    renewToken,
    forgotPassword,
    resetPassword,
    changePassword,
    logout ,
} from '../controllers/authController';
import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);
router.post('/renewToken', renewToken);
router.post('/logout', verifyToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post("/change-password", verifyToken, changePassword);

router.post('/register', register);
router.get('/users', verifyToken, showAllUsers);

export default router;
