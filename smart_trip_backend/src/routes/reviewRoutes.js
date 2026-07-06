const express = require('express');
const { createReview, getReviewByTripId, getAllReviewsAdmin, getPublicReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public route - does not require authentication token
router.get('/public', getPublicReviews);

// Apply authentication protection globally to the remaining review routes
router.use(protect);

router.post('/', createReview);
router.get('/trip/:tripId', getReviewByTripId);

// Admin-only route
router.get('/admin', authorize('admin'), getAllReviewsAdmin);

module.exports = router;
