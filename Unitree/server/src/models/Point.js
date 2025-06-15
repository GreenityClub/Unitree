const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['ATTENDANCE', 'TREE_PURCHASE', 'TREE_REDEMPTION', 'ACHIEVEMENT', 'BONUS'],
    required: true
  },
  metadata: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    description: String,
    achievementId: String,
    treeId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

// Index for faster queries
pointSchema.index({ userId: 1, createdAt: -1 });

const Point = mongoose.model('Point', pointSchema);

module.exports = Point; 