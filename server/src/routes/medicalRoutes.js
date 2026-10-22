import express from 'express';
import {
  getMedicalProfile,
  updateMedicalProfile,
  exportMedicalData,
  eraseMedicalData,
} from '../controllers/medicalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All medical profile endpoints require authentication

router.route('/')
  .get(getMedicalProfile)
  .put(updateMedicalProfile);

router.get('/export', exportMedicalData);
router.delete('/erase', eraseMedicalData);

export default router;
