import express from 'express';
import { login,register,showAllUsers,renewToken
 } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/renewToken', renewToken);
router.post('/register', register);
router.get('/users', showAllUsers);

export default router;
