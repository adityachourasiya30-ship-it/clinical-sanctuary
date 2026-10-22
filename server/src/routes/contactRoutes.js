import express from 'express';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contactController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All contact routes require authentication

router.route('/')
  .get(getContacts)
  .post(createContact);

router.route('/:id')
  .put(updateContact)
  .delete(deleteContact);

export default router;
