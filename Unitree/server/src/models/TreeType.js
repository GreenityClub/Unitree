const mongoose = require('mongoose');

// =================================================================
// ==                      TREE TYPE SCHEMA                     ==
// =================================================================
// This collection stores the different types of trees users can redeem.

const treeTypeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  scientificName: { type: String, required: true },
  description: { type: String, required: true },
  careLevel: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  maxHeight: { type: String, required: true },
  lifespan: { type: String, required: true },
  nativeTo: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  stages: [{ type: String, required: true }],
  isActive: { type: Boolean, default: true, index: true }
}, { 
  timestamps: true,
  collection: 'treetypes'
});


// =================================================================
// ==                       STATIC METHODS                      ==
// =================================================================

/**
 * Finds all active tree types, sorted by cost and name.
 * @returns {Promise<Array>} A promise that resolves to an array of active tree types.
 */
treeTypeSchema.statics.getActiveTreeTypes = function() {
  return this.find({ isActive: true }).sort({ cost: 1, name: 1 });
};

/**
 * Finds a single active tree type by its custom 'id' field.
 * @param {string} treeId - The custom ID of the tree type.
 * @returns {Promise<Object|null>} A promise that resolves to the tree type document or null.
 */
treeTypeSchema.statics.findByTreeId = function(treeId) {
  return this.findOne({ id: treeId, isActive: true });
};


// =================================================================
// ==                      INSTANCE METHODS                     ==
// =================================================================

/**
 * Returns a simplified object with only the necessary display information.
 * @returns {Object} The display information for the tree type.
 */
treeTypeSchema.methods.getDisplayInfo = function() {
  return {
    id: this.id,
    name: this.name,
    scientificName: this.scientificName,
    description: this.description,
    careLevel: this.careLevel,
    maxHeight: this.maxHeight,
    lifespan: this.lifespan,
    nativeTo: this.nativeTo,
    cost: this.cost,
    stages: this.stages
  };
};

const TreeType = mongoose.model('TreeType', treeTypeSchema);
module.exports = TreeType; 