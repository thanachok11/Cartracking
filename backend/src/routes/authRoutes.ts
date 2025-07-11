import express from 'express';
import { login,register,showAllUsers
 } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/users', showAllUsers);

export default router;
