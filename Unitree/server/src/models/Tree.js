const mongoose = require('mongoose');

// =================================================================
// ==                        TREE SCHEMA                        ==
// =================================================================

const treeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  species: { type: String, required: true, comment: "Corresponds to a TreeType _id" },
  name: { type: String, required: true },
  
  // --- Growth & Health ---
  plantedDate: { type: Date, default: Date.now },
  lastWatered: { type: Date, default: Date.now },
  stage: {
    type: String,
    enum: ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'],
    default: 'seedling'
  },
  healthScore: { type: Number, min: 0, max: 100, default: 100 },
  isDead: { type: Boolean, default: false },
  deathDate: { type: Date, default: null },

  // --- WiFi Time Tracking for Growth ---
  totalWifiTime: { type: Number, default: 0, comment: 'Total WiFi time for this tree in seconds.' },
  wifiTimeAtRedeem: { type: Number, default: 0, comment: 'Baseline of user total WiFi time at redemption.' },

  // --- History ---
  milestones: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['PLANTED', 'STAGE_CHANGE', 'WATERED', 'DIED'] },
    description: String,
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// =================================================================
// ==                   MONGOOSE MIDDLEWARE                     ==
// =================================================================

/**
 * Before saving, add a 'PLANTED' milestone if it's a new tree.
 */
treeSchema.pre('save', function(next) {
  if (this.isNew) {
    this.milestones.push({
      type: 'PLANTED',
      description: 'The journey begins. Your tree has been planted!'
    });
  }
  next();
});


// =================================================================
// ==                      INSTANCE METHODS                     ==
// =================================================================

/**
 * Updates the tree's health score. A tree dies if not watered for 5 days.
 * Health degrades by 20 points per day without water.
 */
treeSchema.methods.updateHealthScore = function() {
  if (this.isDead) return;

  const daysSinceWatered = (new Date() - this.lastWatered) / (1000 * 60 * 60 * 24);
  
  if (daysSinceWatered >= 5) {
    this.healthScore = 0;
    this.isDead = true;
    this.deathDate = new Date();
    this.milestones.push({ type: 'DIED', description: 'Died from lack of water.' });
  } else {
    this.healthScore = Math.max(0, 100 - (Math.floor(daysSinceWatered) * 20));
  }
};

/**
 * Updates the tree's growth stage based on WiFi time.
 * NOTE: This method has a dependency on the User model, which is an architectural smell.
 * This logic might be better placed in a service layer.
 */
treeSchema.methods.updateStage = async function() {
  if (this.isDead) return;

  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (!user) return;

    this.totalWifiTime = Math.max(0, user.totalTimeConnected - this.wifiTimeAtRedeem);

    const SECONDS_PER_STAGE = 4 * 3600; // 4 hours
    const stages = ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'];
    const currentStageIndex = Math.floor(this.totalWifiTime / SECONDS_PER_STAGE);
    const newStage = stages[Math.min(currentStageIndex, stages.length - 1)];

    if (newStage !== this.stage) {
      this.stage = newStage;
      this.milestones.push({
        type: 'STAGE_CHANGE',
        description: `Grew into a ${newStage}!`
      });
    }
  } catch (error) {
    console.error(`Error updating stage for tree ${this._id}:`, error);
  }
};

/**
 * Waters the tree, restoring its health to 100.
 * A tree can only be watered once every 24 hours.
 * @returns {{success: boolean, message: string}}
 */
treeSchema.methods.water = function() {
  if (this.isDead) {
    return { success: false, message: 'This tree has passed on. It can no longer be watered.' };
  }
  if ((new Date() - this.lastWatered) < (24 * 60 * 60 * 1000)) {
    return { success: false, message: 'This tree has been watered recently. Try again tomorrow.' };
  }

  this.lastWatered = new Date();
  this.healthScore = 100;
  this.milestones.push({ type: 'WATERED', description: 'You watered the tree. Health restored!' });
  return { success: true, message: 'Tree watered successfully!' };
};

// =================================================================
// ==                         VIRTUALS                          ==
// =================================================================

/**
 * Virtual property to get detailed growth progress information.
 */
treeSchema.virtual('growthProgress').get(function() {
    const SECONDS_PER_STAGE = 4 * 3600;
    const stages = ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'];
    const currentStageIndex = stages.indexOf(this.stage);
    
    if (currentStageIndex === -1 || currentStageIndex === stages.length - 1) {
        return { isMaxStage: true, progressPercent: 100, hoursToNextStage: 0 };
    }

    const timeInCurrentStage = this.totalWifiTime - (currentStageIndex * SECONDS_PER_STAGE);
    const progressPercent = Math.min(100, (timeInCurrentStage / SECONDS_PER_STAGE) * 100);
    
    return {
        isMaxStage: false,
        progressPercent: progressPercent,
        hoursToNextStage: Math.ceil((SECONDS_PER_STAGE - timeInCurrentStage) / 3600)
    };
});

/**
 * Virtual property to get detailed health status information.
 */
treeSchema.virtual('healthStatus').get(function() {
    if (this.isDead) {
      return { status: 'dead', healthScore: 0, canWater: false, daysUntilDeath: 0 };
    }
    const daysSinceWatered = (new Date() - this.lastWatered) / (1000 * 60 * 60 * 24);
    let status = 'healthy';
    if (daysSinceWatered >= 4) status = 'critical';
    else if (daysSinceWatered >= 2) status = 'unhealthy';
    
    return {
      status,
      healthScore: this.healthScore,
      canWater: daysSinceWatered >= 1,
      daysUntilDeath: Math.max(0, 5 - daysSinceWatered)
    };
});


const Tree = mongoose.model('Tree', treeSchema);
module.exports = Tree; 