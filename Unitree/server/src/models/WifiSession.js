const mongoose = require('mongoose');

const wifiSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ssid: {
    type: String,
    required: false,
    default: ''
  },
  bssid: {
    type: String,
    required: false,
    default: ''
  },
  ipAddress: {
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
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  // Location data
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  // Time period tracking
  sessionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Metadata for additional info
  metadata: {
    backgroundSessionId: String,
    syncedAt: Date,
    source: String,
    validationMethods: {
      ipAddress: Boolean,
      location: Boolean
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
wifiSessionSchema.index({ user: 1, createdAt: -1 });
wifiSessionSchema.index({ user: 1, isActive: 1 });
wifiSessionSchema.index({ user: 1, sessionDate: -1 });
wifiSessionSchema.index({ ipAddress: 1 });

// Virtual for calculating real-time duration
wifiSessionSchema.virtual('currentDuration').get(function() {
  if (this.isActive && !this.endTime) {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
  return this.duration;
});

// Static methods for time period queries
wifiSessionSchema.statics.getTodaysStats = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        sessionDate: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: '$duration' },
        totalPoints: { $sum: '$pointsEarned' },
        sessionCount: { $sum: 1 }
      }
    }
  ]);
};

wifiSessionSchema.statics.getWeekStats = function(userId) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        sessionDate: { $gte: weekStart, $lt: weekEnd }
      }
    },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: '$duration' },
        totalPoints: { $sum: '$pointsEarned' },
        sessionCount: { $sum: 1 }
      }
    }
  ]);
};

wifiSessionSchema.statics.getMonthStats = function(userId) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        sessionDate: { $gte: monthStart, $lt: monthEnd }
      }
    },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: '$duration' },
        totalPoints: { $sum: '$pointsEarned' },
        sessionCount: { $sum: 1 }
      }
    }
  ]);
};

wifiSessionSchema.statics.getTotalStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: '$duration' },
        totalPoints: { $sum: '$pointsEarned' },
        sessionCount: { $sum: 1 }
      }
    }
  ]);
};

const WifiSession = mongoose.model('WifiSession', wifiSessionSchema);

module.exports = WifiSession; 