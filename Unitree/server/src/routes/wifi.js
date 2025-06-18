const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const logger = require('../utils/logger');

// Helper function to validate university BSSID
const isValidUniversityBSSID = (bssid) => {
  const allowedPrefix = process.env.UNIVERSITY_BSSID_PREFIX || 'c2:74:ad:1d';
  return bssid && bssid.toLowerCase().startsWith(allowedPrefix.toLowerCase());
};

// Helper function to validate university SSID
const isValidUniversitySSID = (ssid) => {
  const allowedSSIDs = (process.env.ALLOWED_WIFI_SSIDS || '').split(',');
  return allowedSSIDs.includes(ssid);
};

// Start WiFi session
router.post('/start', auth, async (req, res) => {
  try {
    const { ssid, bssid } = req.body;

    // Validate both SSID and BSSID
    if (!isValidUniversitySSID(ssid)) {
      return res.status(400).json({ message: 'Invalid university WiFi SSID' });
    }

    if (!isValidUniversityBSSID(bssid)) {
      return res.status(400).json({ message: 'Invalid university WiFi BSSID' });
    }

    // Check for active session
    let activeSession = await WifiSession.findOne({
      user: req.user._id,
      isActive: true,
      endTime: null,
    });

    if (activeSession) {
      return res.status(400).json({ message: 'Active session already exists' });
    }

    // Create new session
    const session = new WifiSession({
      user: req.user._id,
      ssid,
      bssid,
      startTime: new Date(),
      sessionDate: new Date(),
      isActive: true,
    });

    await session.save();
    
    logger.info(`WiFi session started for user ${req.user._id} on ${ssid} (${bssid})`);
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
      user: req.user._id,
      isActive: true,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    // Calculate duration and points
    const endTime = new Date();
    session.endTime = endTime;
    session.isActive = false;
    
    const durationSeconds = Math.floor((endTime - session.startTime) / 1000);
    session.duration = durationSeconds;
    
    // Calculate points: 1 hour = 100 points
    const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10); // 5 minutes
    const pointsPerHour = parseInt(process.env.POINTS_PER_HOUR || '100', 10);
    
    if (durationSeconds >= minSessionDuration) {
      const pointsEarned = Math.floor((durationSeconds / 3600) * pointsPerHour);
      
      // Update user points
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { points: pointsEarned } }
      );
      
      session.pointsEarned = pointsEarned;
      
      logger.info(`WiFi session ended for user ${req.user._id}. Duration: ${durationSeconds}s, Points: ${pointsEarned}`);
    }

    await session.save();
    res.json({
      ...session.toObject(),
      currentDuration: session.currentDuration
    });
  } catch (error) {
    logger.error('End WiFi session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update active session (for real-time tracking)
router.post('/update', auth, async (req, res) => {
  try {
    const session = await WifiSession.findOne({
      user: req.user._id,
      isActive: true,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    // Calculate current duration and potential points
    const currentTime = new Date();
    const durationSeconds = Math.floor((currentTime - session.startTime) / 1000);
    const pointsPerHour = parseInt(process.env.POINTS_PER_HOUR || '100', 10);
    const potentialPoints = Math.floor((durationSeconds / 3600) * pointsPerHour);

    res.json({
      ...session.toObject(),
      currentDuration: durationSeconds,
      potentialPoints: potentialPoints
    });
  } catch (error) {
    logger.error('Update session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active session
router.get('/active', auth, async (req, res) => {
  try {
    const session = await WifiSession.findOne({
      user: req.user._id,
      isActive: true,
      endTime: null,
    });

    if (session) {
      res.json({
        ...session.toObject(),
        currentDuration: session.currentDuration
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    logger.error('Get active session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await WifiSession.find({
      user: req.user._id,
      endTime: { $ne: null },
    }).sort({ startTime: -1 });

    res.json(sessions);
  } catch (error) {
    logger.error('Get session history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get time period statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [todayStats, weekStats, monthStats, totalStats] = await Promise.all([
      WifiSession.getTodaysStats(req.user._id),
      WifiSession.getWeekStats(req.user._id),
      WifiSession.getMonthStats(req.user._id),
      WifiSession.getTotalStats(req.user._id)
    ]);

    // Include active session in today's stats if exists
    const activeSession = await WifiSession.findOne({
      user: req.user._id,
      isActive: true,
      endTime: null,
    });

    let activeSessionDuration = 0;
    let activeSessionPoints = 0;
    
    if (activeSession) {
      activeSessionDuration = activeSession.currentDuration;
      const pointsPerHour = parseInt(process.env.POINTS_PER_HOUR || '100', 10);
      activeSessionPoints = Math.floor((activeSessionDuration / 3600) * pointsPerHour);
    }

    const stats = {
      today: {
        duration: (todayStats[0]?.totalDuration || 0) + activeSessionDuration,
        points: (todayStats[0]?.totalPoints || 0) + activeSessionPoints,
        sessions: (todayStats[0]?.sessionCount || 0) + (activeSession ? 1 : 0)
      },
      week: {
        duration: (weekStats[0]?.totalDuration || 0) + activeSessionDuration,
        points: (weekStats[0]?.totalPoints || 0) + activeSessionPoints,
        sessions: (weekStats[0]?.sessionCount || 0) + (activeSession ? 1 : 0)
      },
      month: {
        duration: (monthStats[0]?.totalDuration || 0) + activeSessionDuration,
        points: (monthStats[0]?.totalPoints || 0) + activeSessionPoints,
        sessions: (monthStats[0]?.sessionCount || 0) + (activeSession ? 1 : 0)
      },
      total: {
        duration: (totalStats[0]?.totalDuration || 0) + activeSessionDuration,
        points: (totalStats[0]?.totalPoints || 0) + activeSessionPoints,
        sessions: (totalStats[0]?.sessionCount || 0) + (activeSession ? 1 : 0)
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 