const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

// =================================================================
// ==                        USER SCHEMA                        ==
// =================================================================

const userSchema = new mongoose.Schema({
  // --- Basic Information ---
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Hide by default
  },
  fullname: String,
  nickname: String,
  
  // --- Academic Information ---
  university: { type: String, required: true },
  studentId: { type: String, required: [true, 'Please provide a student ID'], unique: true },

  // --- App-specific Data ---
  points: { type: Number, default: 0 },
  allTimePoints: { type: Number, default: 0, comment: 'Total lifetime points for leaderboards.' },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['student'], default: 'student' },

  // --- Relational Data ---
  trees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tree' }],
  realTrees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RealTree' }],

  // --- WiFi Time Tracking ---
  totalTimeConnected: { type: Number, default: 0, comment: 'Total WiFi time in seconds.' },
  dayTimeConnected: { type: Number, default: 0 },
  weekTimeConnected: { type: Number, default: 0 },
  monthTimeConnected: { type: Number, default: 0 },
  lastDayReset: Date,
  lastWeekReset: Date,
  lastMonthReset: Date,

  // --- Session Management (Single Device Login) ---
  activeSession: {
    token: { type: String, select: false },
    refreshToken: { type: String, select: false },
    deviceInfo: { type: String, select: false },
    loginTime: { type: Date, select: false },
    lastActivity: { type: Date, select: false },
    refreshTokenExpiresAt: { type: Date, select: false }
  },

}, { timestamps: true });


// =================================================================
// ==                   PRE-SAVE MIDDLEWARE                     ==
// =================================================================

/**
 * Encrypt password using bcrypt before saving the user document.
 * This middleware only runs if the password field is modified.
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// =================================================================
// ==                      INSTANCE METHODS                     ==
// =================================================================

// --- JWT and Password Methods ---

/**
 * Signs a JWT for the user.
 * @returns {string} The signed JWT.
 */
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });
};

/**
 * Signs a Refresh Token for the user.
 * @returns {string} The signed Refresh Token.
 */
userSchema.methods.getSignedRefreshToken = function() {
  return jwt.sign({ id: this._id, type: 'refresh' }, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRE });
};

/**
 * Compares the entered password with the hashed password in the database.
 * @param {string} enteredPassword - The password to compare.
 * @returns {Promise<boolean>} - True if the passwords match.
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- Session Management Methods ---

/**
 * Sets the active session details for the user, enforcing single-device login.
 * @param {string} token - The JWT for the session.
 * @param {string} refreshToken - The Refresh Token for the session.
 * @param {string} deviceInfo - Information about the device logging in.
 */
userSchema.methods.setActiveSession = async function(token, refreshToken, deviceInfo = 'Unknown Device') {
  this.activeSession = {
    token,
    refreshToken,
    deviceInfo,
    loginTime: new Date(),
    lastActivity: new Date(),
    refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  };
  await this.save({ validateBeforeSave: false });
};

/**
 * Clears the active session details, effectively logging the user out.
 */
userSchema.methods.clearActiveSession = async function() {
  this.activeSession = undefined;
  await this.save({ validateBeforeSave: false });
};

/**
 * Checks if a user has a valid, active session.
 * @returns {boolean} - True if an active session exists.
 */
userSchema.methods.hasActiveSession = function() {
  return !!this.activeSession?.token;
};

/**
 * Verifies if the provided refresh token is valid and not expired.
 * @param {string} refreshToken - The refresh token to validate.
 * @returns {boolean} - True if the token is valid.
 */
userSchema.methods.hasValidRefreshToken = function(refreshToken) {
  return this.activeSession?.refreshToken === refreshToken && 
         this.activeSession?.refreshTokenExpiresAt &&
         new Date() < this.activeSession.refreshTokenExpiresAt;
};

/**
 * Updates the access token for the current session.
 * @param {string} newToken - The new JWT to store.
 */
userSchema.methods.updateAccessToken = async function(newToken) {
  if (this.activeSession) {
    this.activeSession.token = newToken;
    this.activeSession.lastActivity = new Date();
    await this.save({ validateBeforeSave: false });
  }
};


// =================================================================
// ==                 UNUSED/REDUNDANT FIELDS NOTE              ==
// =================================================================
// The following fields from the original schema have been removed as they were not actively used,
// were redundant, or are better handled elsewhere.
// - treesPlanted, virtualTreesPlanted, realTreesPlanted: Can be derived from `trees.length` and `realTrees.length`.
// - lastAttendance, attendanceStreak: No related functionality found.
// - pushToken, notificationSettings, etc.: Notification logic seems incomplete or handled externally.
// The `updatePoints` method was also removed as point updates are handled atomically in routes.
// =================================================================

const User = mongoose.model('User', userSchema);
module.exports = User; 