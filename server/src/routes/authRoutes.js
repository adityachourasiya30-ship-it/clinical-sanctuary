import express from 'express';
import { register, login, googleSignIn, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleSignIn);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
