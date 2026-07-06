const express = require('express');
const {
  getAllTestimonials,
  createTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllTestimonials);

// Admin-only routes
router.post('/', protect, authorize('admin'), createTestimonial);
router.delete('/:id', protect, authorize('admin'), deleteTestimonial);

module.exports = router;
