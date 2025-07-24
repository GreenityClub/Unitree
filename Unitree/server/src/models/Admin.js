const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =================================================================
// ==                        ADMIN SCHEMA                       ==
// =================================================================

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  permissions: {
    manageAdmins: { type: Boolean, default: false },
    manageStudents: { type: Boolean, default: true },
    manageTrees: { type: Boolean, default: true },
    managePoints: { type: Boolean, default: true },
    manageWifiSessions: { type: Boolean, default: true },
    manageTreeTypes: { type: Boolean, default: true },
    manageRealTrees: { type: Boolean, default: true },
    viewStatistics: { type: Boolean, default: true }
  },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });


// =================================================================
// ==                   PRE-SAVE MIDDLEWARE                     ==
// =================================================================

/**
 * Middleware to hash the password before saving if it has been modified.
 * Also ensures a 'superadmin' role has all permissions set to true.
 */
adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  if (this.role === 'superadmin') {
    Object.keys(this.permissions.toObject()).forEach(key => {
        this.permissions[key] = true;
    });
  }
  
  next();
});


// =================================================================
// ==                      INSTANCE METHODS                     ==
// =================================================================

/**
 * Compares a candidate password with the admin's hashed password.
 * @param {string} candidatePassword - The password to compare.
 * @returns {Promise<boolean>} - True if the passwords match.
 */
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generates a signed JWT for the admin.
 * @returns {string} - The signed JWT.
 */
adminSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Admins have a longer session
  );
};

/**
 * Checks if the admin has a specific permission.
 * @param {string} permission - The permission key to check.
 * @returns {boolean} - True if the admin has the permission.
 */
adminSchema.methods.hasPermission = function(permission) {
  return this.role === 'superadmin' || this.permissions[permission];
};

module.exports = mongoose.model('Admin', adminSchema); 