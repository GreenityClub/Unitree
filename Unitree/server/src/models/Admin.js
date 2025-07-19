const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    minlength: 6
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  // Set all permissions to true for superadmin
  if (this.role === 'superadmin') {
    this.permissions = {
      manageAdmins: true,
      manageStudents: true,
      manageTrees: true,
      managePoints: true,
      manageWifiSessions: true,
      manageTreeTypes: true,
      manageRealTrees: true,
      viewStatistics: true
    };
  }
  
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
adminSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
  return this.role === 'superadmin' || this.permissions[permission];
};

module.exports = mongoose.model('Admin', adminSchema); 