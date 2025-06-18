const mongoose = require('mongoose');

const treeTypeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  scientificName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  careLevel: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard'],
    required: true
  },
  maxHeight: {
    type: String,
    required: true
  },
  lifespan: {
    type: String,
    required: true
  },
  nativeTo: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  stages: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create index on id field for faster queries
treeTypeSchema.index({ id: 1 });

// Create index on isActive field for filtering active tree types
treeTypeSchema.index({ isActive: 1 });

// Static method to get all active tree types
treeTypeSchema.statics.getActiveTreeTypes = function() {
  return this.find({ isActive: true }).sort({ cost: 1, name: 1 });
};

// Static method to get tree type by id
treeTypeSchema.statics.findByTreeId = function(treeId) {
  return this.findOne({ id: treeId, isActive: true });
};

// Instance method to get display info
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

const TreeType = mongoose.model('TreeType', treeTypeSchema, 'treetypes');

module.exports = TreeType; 