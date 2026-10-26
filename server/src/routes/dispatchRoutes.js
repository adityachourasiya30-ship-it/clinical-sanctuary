import express from 'express';
import {
  getDispatchQueue,
  getAvailableResponders,
  assignResponder,
  getDispatchStats,
} from '../controllers/dispatchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dispatch routes require DISPATCHER or ADMIN role
router.use(protect);
router.use(authorize('DISPATCHER', 'ADMIN'));

router.get('/queue', getDispatchQueue);
router.get('/responders', getAvailableResponders);
router.post('/incidents/:id/assign', assignResponder);
router.get('/stats', getDispatchStats);

export default router;
