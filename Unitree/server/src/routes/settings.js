const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { authAdmin, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// =================================================================
// ==                   SYSTEM SETTINGS APIs                     ==
// =================================================================

/**
 * @route   GET /api/settings
 * @desc    Get system settings
 * @access  Private (Admin)
 */
router.get('/', authAdmin, async (req, res) => {
  try {
    const settings = await SystemSettings.getCurrent();
    res.json(settings);
  } catch (err) {
    logger.error('Error fetching system settings:', err);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Update system settings
 * @access  Private (Superadmin only)
 */
router.put('/', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    const settings = await SystemSettings.getCurrent();
    
    // List of allowed fields to update
    const allowedFields = [
      'pointsPerMinute',
      'minSessionDuration',
      'maxDailyPoints',
      'treeCostMultiplier',
      'allowGuestAccounts',
      'requireEmailVerification',
      'autoDeleteInactiveTrees',
      'autoDeleteDays',
      'notificationFrequency',
      'adminEmailNotifications',
      'maintenanceMode',
      'apiRateLimit',
    ];
    
    // Update only the allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });
    
    // Record who made the change
    settings.updatedBy = req.admin._id;
    
    await settings.save();
    
    // If maintenance mode was just enabled, log it as an important event
    if (req.body.maintenanceMode === true && settings.maintenanceMode === true) {
      logger.warn(`Maintenance mode enabled by admin ${req.admin.username} (${req.admin._id})`);
    }
    
    res.json(settings);
  } catch (err) {
    logger.error('Error updating system settings:', err);
    res.status(500).json({ message: 'Server error while updating settings' });
  }
});

/**
 * @route   POST /api/settings/reset
 * @desc    Reset system settings to defaults
 * @access  Private (Superadmin only)
 */
router.post('/reset', authAdmin, requireRole('superadmin'), async (req, res) => {
  try {
    // Find and remove current settings
    await SystemSettings.deleteMany({});
    
    // Create new settings with defaults
    const settings = await SystemSettings.getCurrent();
    
    // Record who made the change
    settings.updatedBy = req.admin._id;
    await settings.save();
    
    logger.info(`System settings reset to defaults by admin ${req.admin.username} (${req.admin._id})`);
    
    res.json(settings);
  } catch (err) {
    logger.error('Error resetting system settings:', err);
    res.status(500).json({ message: 'Server error while resetting settings' });
  }
});

module.exports = router; 