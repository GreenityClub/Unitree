const mongoose = require('mongoose');

// =================================================================
// ==                 SYSTEM SETTINGS SCHEMA                     ==
// =================================================================

const systemSettingsSchema = new mongoose.Schema({
  // Points & Sessions
  pointsPerMinute: {
    type: Number,
    default: 2,
    min: 1,
    max: 10
  },
  minSessionDuration: {
    type: Number,
    default: 15,
    min: 5,
    max: 60
  },
  maxDailyPoints: {
    type: Number,
    default: 500,
    min: 100,
    max: 2000
  },
  treeCostMultiplier: {
    type: Number,
    default: 1.5,
    min: 1,
    max: 5
  },
  
  // User settings
  allowGuestAccounts: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: true
  },
  autoDeleteInactiveTrees: {
    type: Boolean,
    default: false
  },
  autoDeleteDays: {
    type: Number,
    default: 90,
    min: 30,
    max: 365
  },
  
  // Notifications
  notificationFrequency: {
    type: String,
    enum: ['instant', 'hourly', 'daily'],
    default: 'daily'
  },
  adminEmailNotifications: {
    type: Boolean,
    default: true
  },
  
  // System management
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  apiRateLimit: {
    type: Number,
    default: 100,
    min: 50,
    max: 1000
  },
  
  // Meta fields
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
});

// Add a pre-save hook to update the lastUpdated timestamp
systemSettingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get current settings (creates default if none exists)
systemSettingsSchema.statics.getCurrent = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // If no settings exist, create default settings
  const defaultSettings = new this();
  await defaultSettings.save();
  return defaultSettings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema); 