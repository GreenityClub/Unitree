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

// Helper function to check and reset time periods if needed
const checkAndResetTimePeriods = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  let updateFields = {};

  // Check day reset (reset at midnight)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  if (!user.lastDayReset || user.lastDayReset < todayStart) {
    updateFields.dayTimeConnected = 0;
    updateFields.lastDayReset = now;
  }

  // Check week reset (reset on Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  if (!user.lastWeekReset || user.lastWeekReset < weekStart) {
    updateFields.weekTimeConnected = 0;
    updateFields.lastWeekReset = now;
  }

  // Check month reset (reset on 1st of month)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  if (!user.lastMonthReset || user.lastMonthReset < monthStart) {
    updateFields.monthTimeConnected = 0;
    updateFields.lastMonthReset = now;
  }

  // Apply resets if needed
  if (Object.keys(updateFields).length > 0) {
    await User.findByIdAndUpdate(userId, updateFields);
    logger.info(`Reset time periods for user ${userId}:`, updateFields);
  }
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

    // Check and reset time periods if needed
    await checkAndResetTimePeriods(req.user._id);

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

    // Check and reset time periods if needed
    await checkAndResetTimePeriods(req.user._id);

    // Calculate duration and points
    const endTime = new Date();
    session.endTime = endTime;
    session.isActive = false;
    
    const durationSeconds = Math.floor((endTime - session.startTime) / 1000);
    session.duration = durationSeconds;
    
    // Calculate points: 1 minute = 1 point
    const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10); // 5 minutes
    
    if (durationSeconds >= minSessionDuration) {
      const pointsEarned = Math.floor(durationSeconds / 60); // 1 minute = 1 point
      
      // Update user points and all time tracking fields
      await User.findByIdAndUpdate(
        req.user._id,
        { 
          $inc: { 
            points: pointsEarned,
            dayTimeConnected: durationSeconds,
            weekTimeConnected: durationSeconds,
            monthTimeConnected: durationSeconds,
            totalTimeConnected: durationSeconds
          }
        }
      );
      
      session.pointsEarned = pointsEarned;
      
      logger.info(`WiFi session ended for user ${req.user._id}. Duration: ${durationSeconds}s, Points: ${pointsEarned}`);
    } else {
      // Even if no points earned, still track the time
      await User.findByIdAndUpdate(
        req.user._id,
        { 
          $inc: { 
            dayTimeConnected: durationSeconds,
            weekTimeConnected: durationSeconds,
            monthTimeConnected: durationSeconds,
            totalTimeConnected: durationSeconds
          }
        }
      );
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
    const potentialPoints = Math.floor(durationSeconds / 60); // 1 minute = 1 point

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

// Get WiFi stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Check and reset time periods if needed
    await checkAndResetTimePeriods(req.user._id);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current active session
    const activeSession = await WifiSession.findOne({
      user: req.user._id,
      isActive: true,
      endTime: null,
    });

    // Add current session duration to day stats if session is active
    let currentSessionDuration = 0;
    if (activeSession) {
      currentSessionDuration = Math.floor((new Date() - activeSession.startTime) / 1000);
    }

    const stats = {
      periods: {
        today: {
          duration: (user.dayTimeConnected || 0) + currentSessionDuration,
          points: Math.floor(((user.dayTimeConnected || 0) + currentSessionDuration) / 60)
        },
        thisWeek: {
          duration: (user.weekTimeConnected || 0) + currentSessionDuration,
          points: Math.floor(((user.weekTimeConnected || 0) + currentSessionDuration) / 60)
        },
        thisMonth: {
          duration: (user.monthTimeConnected || 0) + currentSessionDuration,
          points: Math.floor(((user.monthTimeConnected || 0) + currentSessionDuration) / 60)
        },
        allTime: {
          duration: (user.totalTimeConnected || 0) + currentSessionDuration,
          points: Math.floor(((user.totalTimeConnected || 0) + currentSessionDuration) / 60)
        }
      },
      currentSession: activeSession ? {
        duration: currentSessionDuration,
        points: Math.floor(currentSessionDuration / 60),
        isActive: true,
        startTime: activeSession.startTime,
        ssid: activeSession.ssid,
        bssid: activeSession.bssid
      } : null,
      lastResets: {
        day: user.lastDayReset,
        week: user.lastWeekReset,
        month: user.lastMonthReset
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Get WiFi stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 