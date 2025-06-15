const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'FIRST_TREE',
      'ATTENDANCE_STREAK',
      'POINTS_MILESTONE',
      'TREE_GROWTH',
      'PERFECT_ATTENDANCE'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 0
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    streakDays: Number,
    pointsReached: Number,
    treeCount: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
achievementSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Achievement', achievementSchema); 