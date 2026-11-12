import express from 'express';
import {
  register,
  login,
  googleSignIn,
  getMe,
  logout,
  seedDemoAccounts,
  updateUserRole,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleSignIn);
router.post('/seed-demo', seedDemoAccounts);
router.get('/me', protect, getMe);
router.patch('/role', protect, updateUserRole);
router.post('/logout', protect, logout);

export default router;
