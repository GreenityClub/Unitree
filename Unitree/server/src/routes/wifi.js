const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const Point = require('../models/Point');
const logger = require('../utils/logger');

// Helper function to validate university IP address
const isValidUniversityIP = (ipAddress) => {
  const allowedPrefix = process.env.UNIVERSITY_IP_PREFIX || '192.168';
  return ipAddress && ipAddress.toLowerCase().startsWith(allowedPrefix.toLowerCase());
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
    const { ipAddress } = req.body;

    // Validate IP address (only validation method)
    if (!ipAddress || !isValidUniversityIP(ipAddress)) {
      return res.status(400).json({ message: 'Invalid university WiFi IP address' });
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
      // If there's already an active session with the same IP, just return it
      if (activeSession.ipAddress === ipAddress) {
        logger.info(`Returning existing active session for user ${req.user._id} on IP ${ipAddress}`);
        return res.json(activeSession);
      } else {
        // If there's an active session with different IP, end the old one first
        logger.info(`Ending previous session and starting new one for user ${req.user._id}. Old IP: ${activeSession.ipAddress}, New IP: ${ipAddress}`);
        
        // End the previous session
        const endTime = new Date();
        activeSession.endTime = endTime;
        activeSession.isActive = false;
        
        const durationSeconds = Math.floor((endTime - activeSession.startTime) / 1000);
        activeSession.duration = durationSeconds;
        
        // Calculate points: 1 minute = 1 point
        const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10);
        
        if (durationSeconds >= minSessionDuration) {
          const pointsEarned = Math.floor(durationSeconds / 60);
          
          // Update user points and time tracking
          await User.findByIdAndUpdate(
            req.user._id,
            { 
              $inc: { 
                points: pointsEarned,
                allTimePoints: pointsEarned,
                dayTimeConnected: durationSeconds,
                weekTimeConnected: durationSeconds,
                monthTimeConnected: durationSeconds,
                totalTimeConnected: durationSeconds
              }
            }
          );
          
          // Create point transaction record
          const pointTransaction = new Point({
            userId: req.user._id,
            amount: pointsEarned,
            type: 'WIFI_SESSION',
            metadata: {
              startTime: activeSession.startTime,
              endTime: endTime,
              duration: durationSeconds,
              description: `WiFi session on ${activeSession.ipAddress}`,
            }
          });
          await pointTransaction.save();
          
          activeSession.pointsEarned = pointsEarned;
        } else {
          // Track time even if no points earned
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
        
        await activeSession.save();
      }
    }

    // Create new session
    const session = new WifiSession({
      user: req.user._id,
      ipAddress: ipAddress,
      startTime: new Date(),
      sessionDate: new Date(),
      isActive: true,
    });

    await session.save();
    
    logger.info(`WiFi session started for user ${req.user._id} on IP ${ipAddress}`);
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
      
      // Use transaction to ensure data consistency
      const mongoSession = await mongoose.startSession();
      
      try {
        await mongoSession.withTransaction(async () => {
          // Update user points and all time tracking fields
          await User.findByIdAndUpdate(
            req.user._id,
            { 
              $inc: { 
                points: pointsEarned,
                allTimePoints: pointsEarned, // Add to all-time points 
                dayTimeConnected: durationSeconds,
                weekTimeConnected: durationSeconds,
                monthTimeConnected: durationSeconds,
                totalTimeConnected: durationSeconds
              }
            },
            { session: mongoSession }
          );
          
          // Create point transaction record
          const pointTransaction = new Point({
            userId: req.user._id,
            amount: pointsEarned,
            type: 'WIFI_SESSION',
            metadata: {
              startTime: session.startTime,
              endTime: endTime,
              duration: durationSeconds,
              description: `WiFi session on ${session.ipAddress}`,
            }
          });
          await pointTransaction.save({ session: mongoSession });
          
          // Update session
          session.pointsEarned = pointsEarned;
        });
        
        logger.info(`WiFi session ended for user ${req.user._id}. Duration: ${durationSeconds}s, Points: ${pointsEarned}`);
      } catch (transactionError) {
        logger.error('Transaction failed during session end:', transactionError);
        throw transactionError;
      } finally {
        await mongoSession.endSession();
      }
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

// Get current session count
router.get('/session-count', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionCount = await WifiSession.countDocuments({
      user: req.user._id,
      sessionDate: { $gte: today, $lt: tomorrow }
    });

    res.json({ sessionCount });
  } catch (error) {
    logger.error('Get session count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cleanup orphaned sessions (sessions that are still active but very old)
router.post('/cleanup', auth, async (req, res) => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Find old active sessions
    const orphanedSessions = await WifiSession.find({
      user: req.user._id,
      isActive: true,
      startTime: { $lt: cutoffTime }
    });

    let cleanedCount = 0;
    
    for (const session of orphanedSessions) {
      const endTime = new Date();
      session.endTime = endTime;
      session.isActive = false;
      
      const durationSeconds = Math.floor((endTime - session.startTime) / 1000);
      session.duration = durationSeconds;
      
      // Calculate points for the session
      const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10);
      
      if (durationSeconds >= minSessionDuration) {
        const pointsEarned = Math.floor(durationSeconds / 60);
        
        await User.findByIdAndUpdate(
          req.user._id,
          { 
            $inc: { 
              points: pointsEarned,
              allTimePoints: pointsEarned,
              dayTimeConnected: durationSeconds,
              weekTimeConnected: durationSeconds,
              monthTimeConnected: durationSeconds,
              totalTimeConnected: durationSeconds
            }
          }
        );
        
        // Create point transaction record for cleanup session
        const pointTransaction = new Point({
          userId: req.user._id,
          amount: pointsEarned,
          type: 'WIFI_SESSION',
          metadata: {
            startTime: session.startTime,
            endTime: endTime,
            duration: durationSeconds,
            description: `WiFi session on ${session.ipAddress} (cleanup)`,
          }
        });
        await pointTransaction.save();
        
        session.pointsEarned = pointsEarned;
      }
      
      await session.save();
      cleanedCount++;
    }

    logger.info(`Cleaned up ${cleanedCount} orphaned sessions for user ${req.user._id}`);
    res.json({ message: `Cleaned up ${cleanedCount} orphaned sessions` });
  } catch (error) {
    logger.error('Cleanup sessions error:', error);
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

    // Get session count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionCount = await WifiSession.countDocuments({
      user: req.user._id,
      sessionDate: { $gte: today, $lt: tomorrow }
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
        ipAddress: activeSession.ipAddress
      } : null,
      sessionCount: sessionCount,
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

// Manual sync route to ensure database consistency
router.post('/sync', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all completed WiFi sessions for this user
    const completedSessions = await WifiSession.find({
      user: userId,
      endTime: { $ne: null },
      isActive: false
    }).sort({ startTime: 1 });
    
    // Calculate totals from sessions
    let totalDuration = 0;
    let totalPoints = 0;
    let allTransactionIds = [];
    
    // Check for missing Point transactions and create them
    for (const session of completedSessions) {
      totalDuration += session.duration || 0;
      totalPoints += session.pointsEarned || 0;
      
      // Check if point transaction exists for this session
      const existingTransaction = await Point.findOne({
        userId: userId,
        type: 'WIFI_SESSION',
        'metadata.startTime': session.startTime,
        'metadata.endTime': session.endTime
      });
      
      if (!existingTransaction && session.pointsEarned > 0) {
        // Create missing transaction
        const pointTransaction = new Point({
          userId: userId,
          amount: session.pointsEarned,
          type: 'WIFI_SESSION',
          metadata: {
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            description: `WiFi session on ${session.ipAddress} (sync)`,
          }
        });
        await pointTransaction.save();
        allTransactionIds.push(pointTransaction._id);
        logger.info(`Created missing point transaction for session ${session._id}`);
      } else if (existingTransaction) {
        allTransactionIds.push(existingTransaction._id);
      }
    }
    
    // Calculate current user time stats
    await checkAndResetTimePeriods(userId);
    const user = await User.findById(userId);
    
    // Update user totals if they don't match
    const updates = {};
    if (user.totalTimeConnected !== totalDuration) {
      updates.totalTimeConnected = totalDuration;
    }
    
    // Calculate points from transactions
    const allTransactions = await Point.find({ userId: userId });
    const calculatedPoints = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const calculatedAllTimePoints = allTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (user.points !== calculatedPoints) {
      updates.points = calculatedPoints;
    }
    if (user.allTimePoints !== calculatedAllTimePoints) {
      updates.allTimePoints = calculatedAllTimePoints;
    }
    
    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(userId, updates);
      logger.info(`Synced user ${userId} data:`, updates);
    }
    
    res.json({
      message: 'Data synchronized successfully',
      stats: {
        totalSessions: completedSessions.length,
        totalDuration: totalDuration,
        totalPoints: totalPoints,
        userPointsUpdated: updates.points !== undefined,
        userAllTimePointsUpdated: updates.allTimePoints !== undefined,
        userTimeUpdated: updates.totalTimeConnected !== undefined
      }
    });
    
  } catch (error) {
    logger.error('Sync data error:', error);
    res.status(500).json({ message: 'Server error during sync' });
  }
});

module.exports = router; 