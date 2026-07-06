const express = require('express');
const {
  getAllContacts,
  createContact,
  deleteContact,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public submission endpoint
router.post('/', createContact);

// Admin-only endpoints
router.get('/', protect, authorize('admin'), getAllContacts);
router.delete('/:id', protect, authorize('admin'), deleteContact);

module.exports = router;
