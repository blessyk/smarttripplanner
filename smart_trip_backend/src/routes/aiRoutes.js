const express = require('express');
const {
  generateTrip,
  chat,
  recommendHotels,
  recommendFood,
  optimizeBudget,
  analyzeRisk,
  exploreDestination,
  predictDestinationFromImage
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All AI endpoints require authentication
router.use(protect);

router.post('/generate-trip', generateTrip);
router.post('/chat', chat);
router.post('/recommend-hotels', recommendHotels);
router.post('/recommend-food', recommendFood);
router.post('/optimize-budget', optimizeBudget);
router.post('/analyze-risk', analyzeRisk);
router.post('/explore-destination', exploreDestination);
router.post('/predict-destination', predictDestinationFromImage);

module.exports = router;
