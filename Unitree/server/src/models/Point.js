const mongoose = require('mongoose');

// =================================================================
// ==                        POINT SCHEMA                       ==
// =================================================================

const pointSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['WIFI_SESSION', 'TREE_REDEMPTION', 'REAL_TREE_REDEMPTION', 'ADMIN_ADJUSTMENT', 'ATTENDANCE', 'ACHIEVEMENT', 'BONUS'],
    required: true
  },
  /**
   * Flexible metadata field to store context about the transaction.
   * - For WIFI_SESSION: startTime, endTime, duration
   * - For TREE_REDEMPTION: treeId, species, speciesName
   * - For ADMIN_ADJUSTMENT: reason, adminId
   */
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Index for efficient querying of user's points history
pointSchema.index({ userId: 1, createdAt: -1 });

const Point = mongoose.model('Point', pointSchema);

module.exports = Point; 