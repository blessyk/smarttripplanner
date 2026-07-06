const mongoose = require('mongoose');

const AiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['Success', 'Failure'],
      default: 'Success',
    },
    error: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const AiLog = mongoose.model('AiLog', AiLogSchema);

module.exports = AiLog;
