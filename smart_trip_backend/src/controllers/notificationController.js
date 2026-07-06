const Notification = require('../models/Notification');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get user notifications (and auto-populate weather warnings from trips if empty)
 * @route   GET /api/notifications
 * @access  Private
 */
const getUserNotifications = async (req, res, next) => {
  try {
    let notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Auto-generate weather notifications from existing trips if no notifications exist for them
    const trips = await Trip.find({ userId: req.user._id });
    const now = new Date();
    let createdNew = false;

    for (const trip of trips) {
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);

      // Only alert on ongoing or upcoming destinations
      if (tripEnd < now) continue;

      const hasNotification = await Notification.findOne({
        userId: req.user._id,
        tripId: trip._id,
        type: 'weather'
      });

      if (!hasNotification && trip.weatherInfo && trip.weatherInfo.forecast) {
        const isOngoing = tripStart <= now && tripEnd >= now;
        const statusLabel = isOngoing ? '📍 Ongoing' : '✈️ Upcoming';

        // Keep weather summary minimal and simplified (first sentence)
        let weatherSummary = trip.weatherInfo.forecast || 'Clear skies';
        if (weatherSummary.includes('.')) {
          weatherSummary = weatherSummary.split('.')[0] + '.';
        }

        const title = `${statusLabel} Weather: ${trip.destination}`;
        const message = `${weatherSummary} ${trip.weatherInfo.recommendations || ''}`.trim();

        await Notification.create({
          userId: req.user._id,
          tripId: trip._id,
          title,
          message,
          type: 'weather',
          isRead: false
        });
        createdNew = true;
      }
    }

    if (createdNew) {
      notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
