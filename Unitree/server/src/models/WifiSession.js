const mongoose = require('mongoose');

const wifiSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ssid: {
    type: String,
    required: true
  },
  bssid: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
});

// Index for efficient queries
wifiSessionSchema.index({ userId: 1, createdAt: -1 });

const WifiSession = mongoose.model('WifiSession', wifiSessionSchema);

module.exports = WifiSession; 