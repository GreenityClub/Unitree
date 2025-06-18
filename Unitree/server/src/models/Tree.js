const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  species: {
    type: String,
    required: true
    // Removed enum restriction to allow any species ID from TreeType collection
  },
  name: {
    type: String,
    required: true
  },
  plantedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastWatered: {
    type: Date,
    required: true,
    default: Date.now
  },
  stage: {
    type: String,
    enum: ['sapling', 'young', 'mature'],
    default: 'sapling'
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  location: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    }
  },
  imageUrl: String,
  milestones: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['PLANTED', 'STAGE_CHANGE', 'PERFECT_HEALTH']
    },
    description: String
  }]
}, {
  timestamps: true
});

// Add milestone when tree is created
treeSchema.pre('save', function(next) {
  if (this.isNew) {
    this.milestones.push({
      type: 'PLANTED',
      description: 'Tree was planted'
    });
  }
  next();
});

// Calculate health score based on watering frequency
treeSchema.methods.updateHealthScore = function() {
  const now = new Date();
  const daysSinceWatered = (now - this.lastWatered) / (1000 * 60 * 60 * 24);
  
  // Reduce health by 10 points for each day without watering
  const healthReduction = Math.floor(daysSinceWatered) * 10;
  this.healthScore = Math.max(0, 100 - healthReduction);
  
  return this.healthScore;
};

// Update stage based on age
treeSchema.methods.updateStage = function() {
  const now = new Date();
  const ageInDays = (now - this.plantedDate) / (1000 * 60 * 60 * 24);
  
  let newStage = this.stage;
  if (ageInDays >= 90) { // 3 months
    newStage = 'mature';
  } else if (ageInDays >= 30) { // 1 month
    newStage = 'young';
  }

  // Add milestone if stage changed
  if (newStage !== this.stage) {
    this.milestones.push({
      type: 'STAGE_CHANGE',
      description: `Grew to ${newStage} stage`
    });
    this.stage = newStage;
  }
  
  return this.stage;
};

// Pre-save middleware to update health and stage
treeSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updateHealthScore();
    this.updateStage();
  }
  next();
});

const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree; 