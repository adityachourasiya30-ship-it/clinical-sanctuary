import express from 'express';
import { getNearbyHospitals } from '../controllers/hospitalController.js';

const router = express.Router();

// Can be queried publicly or while logged in
router.get('/nearby', getNearbyHospitals);

export default router;
