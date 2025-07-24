const mongoose = require('mongoose');

// =================================================================
// ==                      REAL TREE SCHEMA                     ==
// =================================================================
// This collection tracks real-world trees planted by users.

const realTreeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentId: { type: String, required: true, index: true },
  treeSpecie: { type: String, required: true },
  plantedDate: { type: Date, default: Date.now, index: true },
  location: { type: String, required: true },
  stage: {
    type: String,
    enum: ['planted', 'thriving', 'dead'], // 'thrive' -> 'thriving' for clarity
    default: 'planted',
    index: true
  },
  pointsCost: { type: Number, required: true },
  notes: { type: String }
}, {
  timestamps: true,
  collection: 'realtrees'
});


// =================================================================
// ==                       STATIC METHODS                      ==
// =================================================================

/**
 * Finds all real trees planted by a specific user.
 * @param {string} userId - The ObjectId of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of real tree documents.
 */
realTreeSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ plantedDate: -1 });
};

/**
 * Finds all real trees associated with a specific student ID.
 * @param {string} studentId - The student's ID string.
 * @returns {Promise<Array>} A promise that resolves to an array of real tree documents.
 */
realTreeSchema.statics.findByStudentId = function(studentId) {
  return this.find({ studentId }).sort({ plantedDate: -1 });
};


// =================================================================
// ==                      INSTANCE METHODS                     ==
// =================================================================

/**
 * Updates the stage of the real tree. Intended for admin use.
 * @param {'planted'|'thriving'|'dead'} newStage - The new stage of the tree.
 * @param {string} [adminNotes] - Optional notes from the admin regarding the update.
 * @returns {Promise<Object>} A promise that resolves to the updated document.
 */
realTreeSchema.methods.updateStage = function(newStage, adminNotes) {
  const validStages = ['planted', 'thriving', 'dead'];
  if (!validStages.includes(newStage)) {
    throw new Error(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
  }
  
  this.stage = newStage;
  if (adminNotes) {
    this.notes = this.notes ? `${this.notes}\n---UPDATE---\n${adminNotes}` : adminNotes;
  }
  
  return this.save();
};

/**
 * Returns a simplified object for display purposes.
 * @returns {Object} The display information for the real tree.
 */
realTreeSchema.methods.getDisplayInfo = function() {
  return {
    id: this._id,
    studentId: this.studentId,
    treeSpecie: this.treeSpecie,
    plantedDate: this.plantedDate,
    location: this.location,
    stage: this.stage,
    pointsCost: this.pointsCost,
    notes: this.notes,
    updatedAt: this.updatedAt
  };
};

const RealTree = mongoose.model('RealTree', realTreeSchema);
module.exports = RealTree; 