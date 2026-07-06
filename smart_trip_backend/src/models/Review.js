const mongoose = require('mongoose');

const ReviewComponentSchema = new mongoose.Schema({
  name: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  sentiment: {
    label: { type: String, enum: ['Positive', 'Neutral', 'Negative'] },
    score: { type: Number },
    keywords: [String]
  }
}, { _id: false });

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      unique: true // Only one review per trip allowed
    },
    destination: {
      type: ReviewComponentSchema,
      required: true
    },
    hotel: {
      type: ReviewComponentSchema
    },
    room: {
      type: ReviewComponentSchema
    },
    restaurant: {
      type: ReviewComponentSchema
    },
    attraction: {
      type: ReviewComponentSchema
    }
  },
  {
    timestamps: true
  }
);

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
