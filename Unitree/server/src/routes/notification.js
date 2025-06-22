const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @route   POST /api/user/push-token
 * @desc    Save user's push notification token
 * @access  Private
 */
router.post('/push-token', auth, async (req, res) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    // Update user's push token
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pushToken, lastActive: new Date() },
      { new: true }
    ).select('-password');

    logger.info(`Push token saved for user ${user.email}: ${pushToken}`);

    res.status(200).json({
      success: true,
      message: 'Push token saved successfully',
      data: { pushToken }
    });

  } catch (error) {
    logger.error('Error saving push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push token',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/user/notification-preference
 * @desc    Update user's notification preferences
 * @access  Private
 */
router.post('/notification-preference', auth, async (req, res) => {
  try {
    const { pushNotificationsEnabled } = req.body;

    // Update user's notification preference
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'notificationSettings.pushNotificationsEnabled': pushNotificationsEnabled,
        lastActive: new Date()
      },
      { new: true }
    ).select('-password');

    logger.info(`Notification preference updated for user ${user.email}: ${pushNotificationsEnabled}`);

    res.status(200).json({
      success: true,
      message: 'Notification preference updated successfully',
      data: { pushNotificationsEnabled }
    });

  } catch (error) {
    logger.error('Error updating notification preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preference',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notification/test
 * @desc    Send test notification to user
 * @access  Private
 */
router.post('/test', auth, async (req, res) => {
  try {
    const { type = 'test' } = req.body;
    
    const user = await User.findById(req.user._id).select('pushToken notificationSettings');
    
    if (!user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'No push token found for user'
      });
    }

    if (!user.notificationSettings.pushNotificationsEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Push notifications are disabled for this user'
      });
    }

    const result = await notificationService.sendTestNotification(user.pushToken, type);

    if (result.success) {
      logger.info(`Test notification sent to user ${user.email}`);
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test notification',
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/notification/reminder/manual
 * @desc    Manually trigger reminder notifications (admin only)
 * @access  Private (admin)
 */
router.post('/reminder/manual', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const result = await notificationService.sendAppReminderNotifications();

    res.status(200).json({
      success: true,
      message: 'Manual reminder notifications triggered',
      data: result
    });

  } catch (error) {
    logger.error('Error sending manual reminder notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder notifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/notification/settings
 * @desc    Get user's notification settings
 * @access  Private
 */
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings pushToken');

    res.status(200).json({
      success: true,
      data: {
        notificationSettings: user.notificationSettings,
        hasPushToken: !!user.pushToken
      }
    });

  } catch (error) {
    logger.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/notification/settings
 * @desc    Update user's notification settings
 * @access  Private
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const { notificationSettings } = req.body;

    if (!notificationSettings) {
      return res.status(400).json({
        success: false,
        message: 'Notification settings are required'
      });
    }

    // Update user's notification settings
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        notificationSettings: {
          ...user.notificationSettings,
          ...notificationSettings
        },
        lastActive: new Date()
      },
      { new: true }
    ).select('notificationSettings');

    logger.info(`Notification settings updated for user ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: { notificationSettings: user.notificationSettings }
    });

  } catch (error) {
    logger.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
});

module.exports = router; 