const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { authAdmin, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// =================================================================
// ==                     ADMIN MANAGEMENT APIS                   ==
// =================================================================
// All routes in this file are protected and require admin authentication

/**
 * @route   GET /api/admins
 * @desc    Get all admins
 * @access  Private (Admin with manageAdmins permission or superadmin)
 */
router.get('/', authAdmin, async (req, res) => {
  try {
    // Check if user has permission to manage admins
    if (!req.admin.permissions?.manageAdmins && req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'You do not have permission to view admin accounts' });
    }

    const admins = await Admin.find()
      .select('-password -refreshToken -refreshTokenExpiresAt')
      .sort({ role: 1, username: 1 });
    
    res.json(admins);
  } catch (err) {
    logger.error('Error fetching admins:', err);
    res.status(500).json({ message: 'Server error while fetching admins' });
  }
});

/**
 * @route   GET /api/admins/:id
 * @desc    Get an admin by ID
 * @access  Private (Admin with manageAdmins permission or superadmin)
 */
router.get('/:id', authAdmin, async (req, res) => {
  try {
    // Check if user has permission to manage admins
    if (!req.admin.permissions?.manageAdmins && req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'You do not have permission to view admin accounts' });
    }

    const admin = await Admin.findById(req.params.id)
      .select('-password -refreshToken -refreshTokenExpiresAt');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (err) {
    logger.error(`Error fetching admin ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error while fetching admin' });
  }
});

/**
 * @route   POST /api/admins
 * @desc    Create a new admin
 * @access  Private (Superadmin only)
 */
router.post('/', authAdmin, async (req, res) => {
  try {
    // Only superadmins can create other superadmins
    if (req.body.role === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can create superadmin accounts' });
    }

    // Regular admins need manageAdmins permission to create other admins
    if (req.admin.role !== 'superadmin' && !req.admin.permissions?.manageAdmins) {
      return res.status(403).json({ message: 'You do not have permission to create admin accounts' });
    }

    const { username, password, role, permissions } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if admin already exists with same username
    let admin = await Admin.findOne({ username });
    if (admin) {
      return res.status(400).json({ message: 'Admin already exists with that username' });
    }

    // Create new admin
    admin = new Admin({
      username,
      password, // Will be hashed by the pre-save hook
      role: role || 'admin',
      permissions: role === 'superadmin' ? undefined : permissions || {}
    });

    await admin.save();

    // Return admin without sensitive fields
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.refreshToken;
    delete adminResponse.refreshTokenExpiresAt;

    res.status(201).json(adminResponse);
  } catch (err) {
    logger.error('Error creating admin:', err);
    res.status(500).json({ message: 'Server error while creating admin' });
  }
});

/**
 * @route   PUT /api/admins/:id
 * @desc    Update an admin
 * @access  Private (Superadmin or admin with manageAdmins permission)
 */
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { username, role, permissions, password } = req.body;
    
    // Find the admin to update
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Check permissions
    const isSuperadmin = req.admin.role === 'superadmin';
    const hasPermission = req.admin.permissions?.manageAdmins;
    const isUpdatingSelf = req.admin._id.toString() === req.params.id;
    
    // Only superadmins can update other superadmins
    if (admin.role === 'superadmin' && !isSuperadmin) {
      return res.status(403).json({ message: 'Only superadmins can modify superadmin accounts' });
    }
    
    // Regular admins need permission to update other admins
    if (!isSuperadmin && !hasPermission && !isUpdatingSelf) {
      return res.status(403).json({ message: 'You do not have permission to update admin accounts' });
    }
    
    // Only superadmins can change roles to superadmin
    if (role === 'superadmin' && !isSuperadmin) {
      return res.status(403).json({ message: 'Only superadmins can promote to superadmin' });
    }
    
    // Update fields
    if (username && !isUpdatingSelf) admin.username = username;
    if (role && !isUpdatingSelf) admin.role = role;
    
    // Update permissions if provided and not a superadmin (superadmins have all permissions)
    if (permissions && role !== 'superadmin' && !isUpdatingSelf) {
      admin.permissions = permissions;
    }
    
    // Update password if provided
    if (password) {
      admin.password = password; // Will be hashed by the pre-save hook
    }
    
    await admin.save();
    
    // Return admin without sensitive fields
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.refreshToken;
    delete adminResponse.refreshTokenExpiresAt;
    
    res.json(adminResponse);
  } catch (err) {
    logger.error(`Error updating admin ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error while updating admin' });
  }
});

/**
 * @route   DELETE /api/admins/:id
 * @desc    Delete an admin
 * @access  Private (Superadmin or admin with manageAdmins permission)
 */
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    // Find the admin to delete
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Check permissions
    const isSuperadmin = req.admin.role === 'superadmin';
    const hasPermission = req.admin.permissions?.manageAdmins;
    const isDeletingSelf = req.admin._id.toString() === req.params.id;
    
    // Prevent deleting yourself
    if (isDeletingSelf) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    // Only superadmins can delete other superadmins
    if (admin.role === 'superadmin' && !isSuperadmin) {
      return res.status(403).json({ message: 'Only superadmins can delete superadmin accounts' });
    }
    
    // Regular admins need permission to delete other admins
    if (!isSuperadmin && !hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to delete admin accounts' });
    }
    
    await Admin.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting admin ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error while deleting admin' });
  }
});

/**
 * @route   POST /api/admins/:id/reset-password
 * @desc    Reset an admin's password
 * @access  Private (Superadmin only)
 */
router.post('/:id/reset-password', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Update password
    admin.password = newPassword; // Will be hashed by the pre-save hook
    await admin.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    logger.error(`Error resetting password for admin ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
});

module.exports = router; 