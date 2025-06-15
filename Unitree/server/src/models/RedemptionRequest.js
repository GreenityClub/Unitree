const mongoose = require('mongoose');

const redemptionRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tree',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  shippingDetails: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String
  },
  adminNotes: {
    type: String
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
});

// Index for efficient queries
redemptionRequestSchema.index({ user: 1, status: 1 });
redemptionRequestSchema.index({ status: 1, requestedAt: 1 });

module.exports = mongoose.model('RedemptionRequest', redemptionRequestSchema); 