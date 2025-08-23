import express from 'express';
import { login,register,showAllUsers,renewToken,forgotPassword,resetPassword,changePassword
 } from '../controllers/authController';
import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);

router.post('/renewToken', renewToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post("/change-password", verifyToken, changePassword);

router.post('/register', register);
router.get('/users', showAllUsers);

export default router;
