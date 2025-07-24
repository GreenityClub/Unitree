const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { authAdmin, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// =================================================================
// ==                     ADMIN MANAGEMENT APIS                   ==
// =================================================================
// All routes in this file are protected and require 'superadmin' role.

/**
 * @route   GET /api/admins
 * @desc    Get all admins
 * @access  Private (superadmin)
 */
router.get('/', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    logger.error('Error getting all admins:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   POST /api/admins
 * @desc    Create a new admin
 * @access  Private (superadmin)
 */
router.post('/', authAdmin, requireRole('superadmin'), async (req, res) => {
  const { username, password, role, permissions } = req.body;
  try {
    let admin = await Admin.findOne({ username });
    if (admin) {
      return res.status(400).json({ message: 'Admin with this username already exists' });
    }
    admin = new Admin({ username, password, role, permissions });
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully', adminId: admin._id });
  } catch (error) {
    logger.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/admins/:id
 * @desc    Update an admin's role and permissions
 * @access  Private (superadmin)
 */
router.put('/:id', authAdmin, requireRole('superadmin'), async (req, res) => {
  const { role, permissions } = req.body;
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent a superadmin from demoting themselves
    if (req.admin.id === req.params.id && req.admin.role === 'superadmin' && role !== 'superadmin') {
        return res.status(400).json({ message: "Cannot demote your own superadmin account." });
    }

    admin.role = role || admin.role;
    if (permissions) {
      admin.permissions = permissions;
    }

    await admin.save();
    res.json({ message: 'Admin updated successfully' });
  } catch (error) {
    logger.error(`Error updating admin ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   DELETE /api/admins/:id
 * @desc    Delete an admin
 * @access  Private (superadmin)
 */
router.delete('/:id', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent a superadmin from deleting themselves
    if (req.admin.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own superadmin account." });
    }

    await admin.deleteOne();
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting admin ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router; 