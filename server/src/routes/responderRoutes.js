import express from 'express';
import {
  getMyProfile,
  updateAvailability,
  getAvailableIncidents,
  acceptIncident,
  updateStatus,
  getIncidentMedicalSummary,
  verifyTier2,
  setResponderTier,
} from '../controllers/responderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All responder routes require authentication and responder/admin role
router.use(protect);
router.use(authorize('RESPONDER', 'ADMIN'));

router.get('/profile', getMyProfile);
router.post('/availability', updateAvailability);
router.get('/incidents', getAvailableIncidents);
router.post('/incidents/:id/accept', acceptIncident);
router.post('/incidents/:id/status', updateStatus);
router.get('/incidents/:id/medical', getIncidentMedicalSummary);
router.post('/verify-tier2', verifyTier2);
router.post('/tier', setResponderTier);

export default router;
