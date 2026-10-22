import express from 'express';
import {
  triggerSOS,
  recordLocationUpdate,
  getLocationHistory,
  resolveIncident,
  getIncidentHistory,
  getTrackIncident,
  uploadAudioEvidence,
} from '../controllers/incidentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { sosLimiter } from '../middleware/rateLimiter.js';
import { uploadAudio } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public live tracking endpoint for emergency contacts
router.get('/track/:incidentCode', getTrackIncident);

// Protected routes
router.post('/sos', protect, sosLimiter, triggerSOS);
router.get('/history', protect, getIncidentHistory);
router.post('/:id/location', protect, recordLocationUpdate);
router.get('/:id/locations', protect, getLocationHistory);
router.post('/:id/resolve', protect, resolveIncident);
router.post('/:id/audio', protect, uploadAudio.single('audio'), uploadAudioEvidence);

export default router;
