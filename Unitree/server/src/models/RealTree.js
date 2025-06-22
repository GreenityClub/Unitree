const mongoose = require('mongoose');

const realTreeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    ref: 'Student',
    comment: 'Student ID from the students collection (e.g., GCH230179)'
  },
  treeSpecie: {
    type: String,
    required: true,
    comment: 'Tree species name'
  },
  plantedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    type: String,
    required: true,
    comment: 'Physical location where the tree is planted'
  },
  stage: {
    type: String,
    enum: ['planted', 'thrive', 'dead'],
    default: 'planted',
    comment: 'Stage will be updated manually by admin in database or admin dashboard'
  },
  // Additional metadata for tracking
  redeemedAt: {
    type: Date,
    default: Date.now,
    comment: 'When the tree was redeemed for points'
  },
  pointsCost: {
    type: Number,
    required: true,
    comment: 'Points spent to redeem this real tree'
  },
  notes: {
    type: String,
    comment: 'Admin notes about the tree status or location'
  }
}, {
  timestamps: true,
  collection: 'realtrees'
});

// Create indexes for efficient queries
realTreeSchema.index({ userId: 1 });
realTreeSchema.index({ studentId: 1 });
realTreeSchema.index({ stage: 1 });
realTreeSchema.index({ plantedDate: -1 });

// Static method to get trees by user
realTreeSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ plantedDate: -1 });
};

// Static method to get trees by student ID
realTreeSchema.statics.findByStudentId = function(studentId) {
  return this.find({ studentId }).sort({ plantedDate: -1 });
};

// Static method to get trees by stage
realTreeSchema.statics.findByStage = function(stage) {
  return this.find({ stage }).sort({ plantedDate: -1 });
};

// Instance method to update stage (admin only)
realTreeSchema.methods.updateStage = function(newStage, adminNotes) {
  if (!['planted', 'thrive', 'dead'].includes(newStage)) {
    throw new Error('Invalid stage. Must be: planted, thrive, or dead');
  }
  
  this.stage = newStage;
  if (adminNotes) {
    this.notes = this.notes ? `${this.notes}\n${adminNotes}` : adminNotes;
  }
  
  return this.save();
};

// Instance method to get display info
realTreeSchema.methods.getDisplayInfo = function() {
  return {
    id: this._id,
    studentId: this.studentId,
    treeSpecie: this.treeSpecie,
    plantedDate: this.plantedDate,
    location: this.location,
    stage: this.stage,
    redeemedAt: this.redeemedAt,
    pointsCost: this.pointsCost,
    notes: this.notes
  };
};

const RealTree = mongoose.model('RealTree', realTreeSchema);

module.exports = RealTree; 