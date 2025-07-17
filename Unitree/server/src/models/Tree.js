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
    enum: ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'],
    default: 'seedling'
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  isDead: {
    type: Boolean,
    default: false
  },
  deathDate: {
    type: Date,
    default: null
  },
  // WiFi connection time tracking for tree growth
  totalWifiTime: {
    type: Number,
    default: 0,
    comment: 'Total wifi connection time for this tree in seconds (starts counting from when tree is redeemed)'
  },
  wifiTimeAtRedeem: {
    type: Number,
    default: 0,
    comment: 'User total wifi time when tree was redeemed (baseline for calculating tree-specific wifi time)'
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
      enum: ['PLANTED', 'STAGE_CHANGE', 'PERFECT_HEALTH', 'WATERED', 'DIED']
    },
    description: String,
    stageFrom: String,
    stageTo: String
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

// Calculate health score based on watering frequency (tree dies after 5 days without watering)
treeSchema.methods.updateHealthScore = function() {
  // Skip health calculation if tree is already dead
  if (this.isDead) {
    return this.healthScore;
  }

  const now = new Date();
  const daysSinceWatered = (now - this.lastWatered) / (1000 * 60 * 60 * 24);
  
  if (daysSinceWatered >= 5) {
    // Tree dies after 5 days without watering
    this.healthScore = 0;
    this.isDead = true;
    this.deathDate = now;
    
    this.milestones.push({
      type: 'DIED',
      description: 'Tree died from lack of watering (5+ days without water)'
    });
  } else {
    // Gradual health reduction: 20 points per day without watering
    const healthReduction = Math.floor(daysSinceWatered) * 20;
    this.healthScore = Math.max(0, 100 - healthReduction);
  }
  
  return this.healthScore;
};

// Update stage based on wifi connection time (4 hours per stage)
treeSchema.methods.updateStage = async function() {
  // Skip stage update if tree is dead
  if (this.isDead) {
    return this.stage;
  }

  try {
    // Get user's current total wifi time
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      return this.stage;
    }

    // Calculate tree-specific wifi time (total wifi time since tree was redeemed)
    const treeWifiTime = user.totalTimeConnected - this.wifiTimeAtRedeem;
    this.totalWifiTime = Math.max(0, treeWifiTime);

    // Define stage requirements (4 hours = 14400 seconds per stage)
    const HOURS_PER_STAGE = 4;
    const SECONDS_PER_STAGE = HOURS_PER_STAGE * 60 * 60; // 14400 seconds
    
    const stages = ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'];
    let newStage = 'seedling';
    
    // Determine stage based on wifi time
    for (let i = 0; i < stages.length; i++) {
      const requiredTime = i * SECONDS_PER_STAGE;
      if (this.totalWifiTime >= requiredTime) {
        newStage = stages[i];
      } else {
        break;
      }
    }

    // Add milestone if stage changed
    if (newStage !== this.stage) {
      const oldStage = this.stage;
      this.stage = newStage;
      
      this.milestones.push({
        type: 'STAGE_CHANGE',
        description: `Tree grew from ${oldStage} to ${newStage} after ${Math.floor(this.totalWifiTime / 3600)} hours of wifi connection`,
        stageFrom: oldStage,
        stageTo: newStage
      });

      // Gửi push notification cho user khi cây lên stage mới
      try {
        const notificationServiceV1 = require('../services/notificationServiceV1');
        if (user.pushToken && user.notificationSettings?.pushNotificationsEnabled) {
          await notificationServiceV1.sendPushNotification(
            user.pushToken,
            '🌱 Cây của bạn đã lớn hơn rồi!',
            `Chúc mừng! Cây UniTree của bạn vừa phát triển sang giai đoạn mới: ${newStage}.`,
            { type: 'tree_stage_up', stage: newStage }
          );
        }
      } catch (notifyErr) {
        console.error('Error sending stage up notification:', notifyErr);
      }
    }
    
    return this.stage;
  } catch (error) {
    console.error('Error updating tree stage:', error);
    return this.stage;
  }
};

// Water the tree
treeSchema.methods.water = function() {
  // Cannot water a dead tree
  if (this.isDead) {
    return { success: false, message: 'Cannot water a dead tree' };
  }

  const now = new Date();
  const daysSinceLastWatered = (now - this.lastWatered) / (1000 * 60 * 60 * 24);
  
  // Prevent over-watering (can only water once per day)
  if (daysSinceLastWatered < 1) {
    return { success: false, message: 'Tree has already been watered today' };
  }

  this.lastWatered = now;
  this.healthScore = 100; // Restore full health when watered
  
  this.milestones.push({
    type: 'WATERED',
    description: 'Tree was watered and health restored to 100%'
  });

  return { success: true, message: 'Tree watered successfully' };
};

// Get tree growth progress information
treeSchema.methods.getGrowthProgress = function() {
  const HOURS_PER_STAGE = 4;
  const SECONDS_PER_STAGE = HOURS_PER_STAGE * 60 * 60;
  const stages = ['seedling', 'sprout', 'sapling', 'young_tree', 'mature_tree', 'ancient_tree'];
  
  const currentStageIndex = stages.indexOf(this.stage);
  const nextStageIndex = currentStageIndex + 1;
  
  // Calculate progress to next stage
  const currentStageRequiredTime = currentStageIndex * SECONDS_PER_STAGE;
  const nextStageRequiredTime = nextStageIndex * SECONDS_PER_STAGE;
  const progressInCurrentStage = this.totalWifiTime - currentStageRequiredTime;
  const timeNeededForNextStage = nextStageRequiredTime - this.totalWifiTime;
  
  return {
    currentStage: this.stage,
    nextStage: nextStageIndex < stages.length ? stages[nextStageIndex] : null,
    isMaxStage: nextStageIndex >= stages.length,
    totalWifiHours: Math.floor(this.totalWifiTime / 3600),
    progressInCurrentStage: Math.max(0, progressInCurrentStage),
    timeNeededForNextStage: nextStageIndex < stages.length ? Math.max(0, timeNeededForNextStage) : 0,
    progressPercent: nextStageIndex < stages.length 
      ? Math.min(100, (progressInCurrentStage / SECONDS_PER_STAGE) * 100)
      : 100,
    hoursToNextStage: nextStageIndex < stages.length 
      ? Math.ceil(timeNeededForNextStage / 3600)
      : 0
  };
};

// Get health status information
treeSchema.methods.getHealthStatus = function() {
  if (this.isDead) {
    return {
      status: 'dead',
      healthScore: 0,
      daysSinceWatered: null,
      daysUntilDeath: 0,
      canWater: false,
      deathDate: this.deathDate
    };
  }

  const now = new Date();
  const daysSinceWatered = (now - this.lastWatered) / (1000 * 60 * 60 * 24);
  const daysUntilDeath = Math.max(0, 5 - daysSinceWatered);
  
  let status = 'healthy';
  if (daysSinceWatered >= 4) {
    status = 'critical';
  } else if (daysSinceWatered >= 2) {
    status = 'unhealthy';
  }

  return {
    status,
    healthScore: this.healthScore,
    daysSinceWatered: Math.floor(daysSinceWatered * 10) / 10, // Round to 1 decimal
    daysUntilDeath: Math.floor(daysUntilDeath * 10) / 10, // Round to 1 decimal
    canWater: daysSinceWatered >= 1,
    lastWatered: this.lastWatered
  };
};

// Pre-save middleware to update health and stage
treeSchema.pre('save', async function(next) {
  if (!this.isNew) {
    this.updateHealthScore();
    await this.updateStage();
  }
  next();
});

const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree; 