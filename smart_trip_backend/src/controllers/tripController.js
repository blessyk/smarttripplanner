const Trip = require('../models/Trip');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all trips of the logged-in user
 * @route   GET /api/trips
 * @access  Private
 */
const getUserTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        trips
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single trip details
 * @route   GET /api/trips/:id
 * @access  Private
 */
const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trip) {
      return next(new ApiError(404, `Trip not found with ID ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

const { getCoordinates, getScheduleItemCoordinates } = require('./aiController');

/**
 * @desc    Create a new trip
 * @route   POST /api/trips
 * @access  Private
 */
const createTrip = async (req, res, next) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      tripType,
      interests,
      accommodationPreference,
      foodPreference,
      transportationPreference,
      specialRequirements,
      itinerary,
      attractions,
      recommendedHotels,
      recommendedRestaurants,
      budgetBreakdown,
      weatherInfo,
      riskAnalysis
    } = req.body;

    let destLat = req.body.latitude;
    let destLon = req.body.longitude;

    if (destination && (!destLat || !destLon)) {
      try {
        const coords = await getCoordinates(destination);
        destLat = coords.lat;
        destLon = coords.lon;
      } catch (err) {
        console.warn('Geocoding destination failed in createTrip:', err);
      }
    }

    // Geocode itinerary spots if coordinates are missing
    if (itinerary && itinerary.length > 0 && destLat && destLon) {
      const geocodePromises = [];
      itinerary.forEach((dayPlan) => {
        if (dayPlan.schedule && dayPlan.schedule.length > 0) {
          dayPlan.schedule.forEach((item, idx) => {
            if (!item.latitude || !item.longitude) {
              const searchName = item.location || item.activity;
              if (searchName) {
                const promise = getScheduleItemCoordinates(searchName, destination, destLat, destLon, idx)
                  .then((itemCoords) => {
                    item.latitude = itemCoords.lat;
                    item.longitude = itemCoords.lon;
                  })
                  .catch(() => {});
                geocodePromises.push(promise);
              }
            }
          });
        }
      });
      if (geocodePromises.length > 0) {
        await Promise.all(geocodePromises);
      }
    }

    const trip = await Trip.create({
      userId: req.user._id,
      destination,
      startDate,
      endDate,
      numberOfDays: itinerary ? itinerary.length : 1,
      budget,
      travelers,
      tripType,
      interests: interests || [],
      accommodationPreference: accommodationPreference || 'Standard',
      foodPreference: foodPreference || 'Local Cuisine',
      transportationPreference: transportationPreference || 'any',
      specialRequirements: specialRequirements || '',
      itinerary,
      attractions: attractions || [],
      recommendedHotels: recommendedHotels || [],
      recommendedRestaurants: recommendedRestaurants || [],
      budgetBreakdown: budgetBreakdown || {
        accommodationBudget: 0,
        foodBudget: 0,
        transportationBudget: 0,
        activityBudget: 0,
        emergencyBudget: 0
      },
      weatherInfo: weatherInfo || {
        forecast: 'No weather information available',
        warnings: 'None',
        recommendations: ''
      },
      riskAnalysis: riskAnalysis || {
        riskLevel: 'Low',
        reason: '',
        recommendation: ''
      },
      latitude: destLat,
      longitude: destLon
    });

    res.status(201).json({
      success: true,
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a trip
 * @route   PUT /api/trips/:id
 * @access  Private
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!trip) {
      return next(new ApiError(404, `Trip not found with ID ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      data: {
        trip
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a trip
 * @route   DELETE /api/trips/:id
 * @access  Private
 */
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!trip) {
      return next(new ApiError(404, `Trip not found with ID ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all trips in system (Admin view)
 * @route   GET /api/admin/trips
 * @access  Private/Admin
 */
const getAllTrips = async (req, res, next) => {
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
          { destination: { $regex: search, $options: 'i' } },
          { userId: { $in: userIds } }
        ]
      };
    }

    const total = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Calculate system-wide KPIs
    const statsResult = await Trip.aggregate([
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget' },
          avgDays: { $avg: '$numberOfDays' }
        }
      }
    ]);

    const stats = {
      totalTrips: await Trip.countDocuments(),
      totalBudget: statsResult[0]?.totalBudget || 0,
      avgDays: statsResult[0]?.avgDays ? parseFloat(statsResult[0].avgDays.toFixed(1)) : 0
    };

    res.status(200).json({
      success: true,
      message: 'All trips retrieved for admin',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats,
      data: {
        trips
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getAllTrips
};
