const Review = require('../models/Review');
const User = require('../models/User');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const { analyzeSentimentText } = require('./aiController');

/**
 * @desc    Create a new trip review and analyze its sentiment
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res, next) => {
  try {
    const { tripId, destination, hotel, room, restaurant, attraction } = req.body;
    const userId = req.user._id;

    if (!tripId) {
      return next(new ApiError(400, 'Trip ID is required'));
    }

    if (!destination || !destination.name || !destination.rating) {
      return next(new ApiError(400, 'Destination name and rating are required'));
    }

    // Verify trip exists and belongs to user
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      return next(new ApiError(404, 'Associated trip not found or unauthorized'));
    }

    // Check if review already exists for this trip
    const existingReview = await Review.findOne({ tripId, userId });

    // Prepare components
    const reviewData = {
      userId,
      tripId,
      destination: {
        name: destination.name,
        rating: Number(destination.rating),
        comment: destination.comment || '',
        sentiment: destination.comment ? await analyzeSentimentText(destination.comment) : { label: 'Neutral', score: 0, keywords: [] }
      }
    };

    if (hotel && hotel.name) {
      reviewData.hotel = {
        name: hotel.name,
        roomType: hotel.roomType || 'Standard',
        rating: Number(hotel.rating),
        comment: hotel.comment || '',
        sentiment: hotel.comment ? await analyzeSentimentText(hotel.comment) : { label: 'Neutral', score: 0, keywords: [] }
      };
    }

    if (room && room.name) {
      reviewData.room = {
        name: room.name,
        rating: Number(room.rating),
        comment: room.comment || '',
        sentiment: room.comment ? await analyzeSentimentText(room.comment) : { label: 'Neutral', score: 0, keywords: [] }
      };
    }

    if (restaurant && restaurant.name) {
      reviewData.restaurant = {
        name: restaurant.name,
        rating: Number(restaurant.rating),
        comment: restaurant.comment || '',
        sentiment: restaurant.comment ? await analyzeSentimentText(restaurant.comment) : { label: 'Neutral', score: 0, keywords: [] }
      };
    }

    if (attraction && attraction.name) {
      reviewData.attraction = {
        name: attraction.name,
        rating: Number(attraction.rating),
        comment: attraction.comment || '',
        sentiment: attraction.comment ? await analyzeSentimentText(attraction.comment) : { label: 'Neutral', score: 0, keywords: [] }
      };
    }

    let review;
    if (existingReview) {
      review = await Review.findOneAndUpdate(
        { tripId, userId },
        reviewData,
        { returnDocument: 'after' }
      );
    } else {
      review = await Review.create(reviewData);
    }

    res.status(200).json({
      success: true,
      message: existingReview 
        ? 'Review updated and sentiment re-analyzed successfully' 
        : 'Review submitted and sentiment analyzed successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get review by trip ID
 * @route   GET /api/reviews/trip/:tripId
 * @access  Private
 */
const getReviewByTripId = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({ tripId, userId });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews (Admin view)
 * @route   GET /api/reviews/admin
 * @access  Private/Admin
 */
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const startIndex = (page - 1) * limit;

    let query = {};
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      query = {
        $or: [
          { 'destination.name': { $regex: search, $options: 'i' } },
          { userId: { $in: userIds } }
        ]
      };
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('userId', 'name email')
      .populate('tripId', 'destination startDate endDate')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Compute global metrics for charts and cards
    const allReviews = await Review.find().select('destination.rating destination.sentiment.label');
    const totalReviewsCount = allReviews.length;
    const avgRating = totalReviewsCount > 0
      ? parseFloat((allReviews.reduce((acc, r) => acc + (r.destination?.rating || 0), 0) / totalReviewsCount).toFixed(1))
      : 0;

    const sentimentCounts = allReviews.reduce(
      (acc, r) => {
        const lbl = r.destination?.sentiment?.label || 'Neutral';
        if (lbl === 'Positive') acc.positive++;
        else if (lbl === 'Negative') acc.negative++;
        else acc.neutral++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalReviews: totalReviewsCount,
        avgRating,
        sentimentCounts
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public reviews
 * @route   GET /api/reviews/public
 * @access  Public
 */
const getPublicReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name")
      .populate("tripId", "destination")
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviewByTripId,
  getAllReviewsAdmin,
  getPublicReviews
};
