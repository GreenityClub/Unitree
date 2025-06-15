const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const logger = require('../utils/logger');

// Start WiFi session
router.post('/start', auth, async (req, res) => {
  try {
    const { ssid, bssid } = req.body;

    // Validate university WiFi
    if (!process.env.ALLOWED_WIFI_SSIDS.split(',').includes(ssid)) {
      return res.status(400).json({ message: 'Invalid university WiFi' });
    }

    // Check for active session
    let activeSession = await WifiSession.findOne({
      user: req.user.userId,
      endTime: null,
    });

    if (activeSession) {
      return res.status(400).json({ message: 'Active session already exists' });
    }

    // Create new session
    const session = new WifiSession({
      user: req.user.userId,
      ssid,
      bssid,
      startTime: new Date(),
    });

    await session.save();
    res.json(session);
  } catch (error) {
    logger.error('Start WiFi session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End WiFi session
router.post('/end', auth, async (req, res) => {
  try {
    const session = await WifiSession.findOne({
      user: req.user.userId,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    // Calculate duration and points
    session.endTime = new Date();
    const durationMinutes = (session.endTime - session.startTime) / (1000 * 60);
    
    if (durationMinutes >= process.env.MIN_SESSION_DURATION) {
      const pointsEarned = Math.floor(durationMinutes / 60 * process.env.POINTS_PER_HOUR);
      
      // Update user points
      await User.findByIdAndUpdate(
        req.user.userId,
        { $inc: { points: pointsEarned } }
      );
      
      session.pointsEarned = pointsEarned;
    }

    await session.save();
    res.json(session);
  } catch (error) {
    logger.error('End WiFi session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active session
router.get('/active', auth, async (req, res) => {
  try {
    const session = await WifiSession.findOne({
      user: req.user.userId,
      endTime: null,
    });

    res.json(session || null);
  } catch (error) {
    logger.error('Get active session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await WifiSession.find({
      user: req.user.userId,
      endTime: { $ne: null },
    }).sort({ startTime: -1 });

    res.json(sessions);
  } catch (error) {
    logger.error('Get session history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 