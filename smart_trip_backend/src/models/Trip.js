const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
    },
    tripType: {
      type: String,
      required: true,
      enum: ['Solo', 'Friends', 'Family', 'Couple', 'Kids', 'Business'],
    },
    travelers: {
      type: Number,
      default: 1,
    },
    interests: {
      type: [String],
      default: [],
    },
    accommodationPreference: {
      type: String,
      default: 'Standard',
    },
    foodPreference: {
      type: String,
      default: 'Local Cuisine',
    },
    itinerary: [
      {
        day: { type: Number, required: true },
        date: { type: String },
        schedule: [
          {
            time: { type: String, required: true },
            activity: { type: String, required: true },
            description: { type: String },
            location: { type: String },
            cost: { type: Number, default: 0 },
            latitude: { type: Number },
            longitude: { type: Number }
          }
        ]
      }
    ],
    attractions: [
      {
        placeName: { type: String, required: true },
        category: { type: String },
        bestTimeToVisit: { type: String },
        estimatedDuration: { type: String },
        entryFee: { type: Number, default: 0 },
        distanceFromDestination: { type: String }
      }
    ],
    recommendedHotels: [
      {
        hotelName: { type: String, required: true },
        rating: { type: Number },
        estimatedCost: { type: Number },
        location: { type: String },
        reasonForRecommendation: { type: String },
        sentiment: {
          positivePercentage: { type: Number, default: 0 },
          neutralPercentage: { type: Number, default: 0 },
          negativePercentage: { type: Number, default: 0 },
          recommendationScore: { type: Number, default: 0 }
        }
      }
    ],
    recommendedRestaurants: [
      {
        restaurantName: { type: String, required: true },
        cuisine: { type: String },
        estimatedCost: { type: Number },
        specialty: { type: String },
        sentiment: {
          positivePercentage: { type: Number, default: 0 },
          neutralPercentage: { type: Number, default: 0 },
          negativePercentage: { type: Number, default: 0 },
          recommendationScore: { type: Number, default: 0 }
        }
      }
    ],
    budgetBreakdown: {
      accommodationBudget: { type: Number, default: 0 },
      foodBudget: { type: Number, default: 0 },
      transportationBudget: { type: Number, default: 0 },
      activityBudget: { type: Number, default: 0 },
      emergencyBudget: { type: Number, default: 0 }
    },
    weatherInfo: {
      forecast: { type: String },
      warnings: { type: String },
      recommendations: { type: String }
    },
    sentimentAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    riskAnalysis: {
      riskLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Low' },
      reason: { type: String },
      recommendation: { type: String }
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    chatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model('Trip', TripSchema);

module.exports = Trip;
