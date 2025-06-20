const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  fullname: {
    type: String,
    required: false
  },
  nickname: {
    type: String
  },
  points: {
    type: Number,
    default: 0
  },
  allTimePoints: {
    type: Number,
    default: 0,
    comment: 'Total lifetime points earned - never decreases, used for leaderboard'
  },
  treesPlanted: {
    type: Number,
    default: 0
  },
  university: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: [true, 'Please provide a student ID'],
    unique: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  trees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tree'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },

  lastAttendance: {
    type: Date,
    default: null,
  },
  attendanceStreak: {
    type: Number,
    default: 0,
  },
  
  // WiFi tracking fields - matching database schema
  dayTimeConnected: {
    type: Number,
    default: 0,
    comment: 'Time connected today in seconds'
  },
  weekTimeConnected: {
    type: Number,
    default: 0,
    comment: 'Time connected this week in seconds'
  },
  monthTimeConnected: {
    type: Number,
    default: 0,
    comment: 'Time connected this month in seconds'
  },
  totalTimeConnected: {
    type: Number,
    default: 0,
    comment: 'Total time connected to university WiFi in seconds - used for leaderboard calculation'
  },
  lastDayReset: {
    type: Date,
    default: null,
    comment: 'Last time day stats were reset'
  },
  lastWeekReset: {
    type: Date,
    default: null,
    comment: 'Last time week stats were reset'
  },
  lastMonthReset: {
    type: Date,
    default: null,
    comment: 'Last time month stats were reset'
  },
  
  // Session management for single device login
  activeSession: {
    token: {
      type: String,
      default: null,
      select: false
    },
    deviceInfo: {
      type: String,
      default: null,
      select: false
    },
    loginTime: {
      type: Date,
      default: null,
      select: false
    },
    lastActivity: {
      type: Date,
      default: null,
      select: false
    }
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Update points method - adds to both current points and all-time points
userSchema.methods.updatePoints = async function(points) {
  this.points += points;
  // Only add to all-time points if adding points (not subtracting)
  if (points > 0) {
    this.allTimePoints += points;
  }
  await this.save();
  return this.points;
};

// Session management methods
userSchema.methods.setActiveSession = async function(token, deviceInfo = 'Unknown Device') {
  this.activeSession = {
    token: token,
    deviceInfo: deviceInfo,
    loginTime: new Date(),
    lastActivity: new Date()
  };
  await this.save();
};

userSchema.methods.clearActiveSession = async function() {
  this.activeSession = {
    token: null,
    deviceInfo: null,
    loginTime: null,
    lastActivity: null
  };
  await this.save();
};

userSchema.methods.hasActiveSession = function() {
  return this.activeSession && this.activeSession.token && this.activeSession.token.trim() !== '';
};

userSchema.methods.updateLastActivity = async function() {
  if (this.activeSession && this.activeSession.token && this.activeSession.token.trim() !== '') {
    this.activeSession.lastActivity = new Date();
    await this.save();
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 