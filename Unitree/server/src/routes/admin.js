const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { authAdmin, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all admins (superadmin only)
router.get('/', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const admins = await Admin.find({ _id: { $ne: req.admin._id } }).select('-password');
    
    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin accounts'
    });
  }
});

// Get admin by ID (superadmin only)
router.get('/:id', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin account'
    });
  }
});

// Create new admin (superadmin only)
router.post('/', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const { username, password, permissions } = req.body;
    
    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Username already in use'
      });
    }
    
    // Create new admin
    const admin = new Admin({
      username,
      password,
      permissions
    });
    
    await admin.save();
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin account'
    });
  }
});

// Update admin (superadmin only)
router.put('/:id', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const { username, permissions } = req.body;
    
    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Prevent changing superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify superadmin account'
      });
    }
    
    // Check if username already exists (if changing username)
    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Username already in use'
        });
      }
      admin.username = username;
    }
    
    // Update permissions
    if (permissions) {
      admin.permissions = {
        ...admin.permissions,
        ...permissions
      };
    }
    
    await admin.save();
    
    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin account'
    });
  }
});

// Reset admin password (superadmin only)
router.post('/:id/reset-password', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // Find admin
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Prevent changing superadmin password
    if (admin.role === 'superadmin' && admin._id.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify superadmin account'
      });
    }
    
    // Update password
    admin.password = newPassword;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// Delete admin (superadmin only)
router.delete('/:id', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    // Find admin
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Prevent deleting superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete superadmin account'
      });
    }
    
    await Admin.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin account'
    });
  }
});

module.exports = router; 