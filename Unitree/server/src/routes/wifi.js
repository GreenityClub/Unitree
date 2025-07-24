const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authAdmin } = require('../middleware/auth');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const Point = require('../models/Point');
const logger = require('../utils/logger');

// =================================================================
// ==                     HELPER FUNCTIONS                      ==
// =================================================================

// Utility function to execute operations with transactions when available
const executeWithOptionalTransaction = async (operations) => {
  let transactionSession = null;
  let useTransactions = false;
  
  try {
    // Check if transactions are supported (replica set/mongos)
    transactionSession = await mongoose.startSession();
    useTransactions = true;
  } catch (sessionError) {
    logger.debug('MongoDB transactions not supported, using sequential operations');
    useTransactions = false;
  }
  
  try {
    if (useTransactions && transactionSession) {
      // Production: Use transactions for atomic operations
      return await transactionSession.withTransaction(async () => {
        return await operations(transactionSession);
      });
    } else {
      // Local development: Sequential operations
      return await operations(null);
    }
  } finally {
    if (transactionSession) {
      await transactionSession.endSession();
    }
  }
};

// Helper function to validate university IP address
const isValidUniversityIP = (ipAddress) => {
  const allowedPrefix = process.env.UNIVERSITY_IP_PREFIX || '192.168';
  return ipAddress && ipAddress.toLowerCase().startsWith(allowedPrefix.toLowerCase());
};

// Helper function to validate location within university campus
const isValidUniversityLocation = (location) => {
  if (!location || !location.latitude || !location.longitude) return false;
  
  // University campus coordinates (configurable via environment)
  const universityLat = parseFloat(process.env.UNIVERSITY_LAT || '10.8231'); // Default: HCMC
  const universityLng = parseFloat(process.env.UNIVERSITY_LNG || '106.6297');
  const universityRadius = parseFloat(process.env.UNIVERSITY_RADIUS || '100'); // 100m default
  
  // Calculate distance using Haversine formula
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (location.latitude * Math.PI) / 180;
  const φ2 = (universityLat * Math.PI) / 180;
  const Δφ = ((universityLat - location.latitude) * Math.PI) / 180;
  const Δλ = ((universityLng - location.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= universityRadius;
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


// =================================================================
// ==                      MOBILE-ONLY APIS                     ==
// =================================================================

// @route   POST /api/wifi/start
// @desc    Start a new WiFi session for a user
// @access  Private (Mobile)
router.post('/start', auth, async (req, res) => {
  try {
    const { ipAddress, location, validationMethods, campus, distance } = req.body;

    // Enhanced validation: Require BOTH IP and location to be valid
    const isValidIP = ipAddress && isValidUniversityIP(ipAddress);
    const isValidLocation = location && isValidUniversityLocation(location);
    
    if (!isValidIP || !isValidLocation) {
      return res.status(400).json({ 
        message: 'Invalid university access - must be connected to university WiFi AND be physically on campus',
        validation: {
          ipValid: isValidIP,
          locationValid: isValidLocation,
          requiresBoth: true
        }
      });
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
          // Check for existing transaction to prevent double point
          const existingTransaction = await Point.findOne({
            userId: req.user._id,
            type: 'WIFI_SESSION',
            'metadata.startTime': activeSession.startTime,
            'metadata.endTime': endTime
          });
          if (!existingTransaction) {
            // Try to use transactions if available, fallback to sequential operations
            let transactionSession = null;
            let useTransactions = false;
            
            try {
              transactionSession = await mongoose.startSession();
              useTransactions = true;
            } catch (sessionError) {
              useTransactions = false;
            }
            
            try {
              if (useTransactions && transactionSession) {
                await transactionSession.withTransaction(async () => {
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
                    },
                    { session: transactionSession }
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
                  await pointTransaction.save({ session: transactionSession });
                  activeSession.pointsEarned = pointsEarned;
                });
              } else {
                // Sequential operations for local development
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
              }
            } finally {
              if (transactionSession) {
                await transactionSession.endSession();
              }
            }
          } else {
            logger.info(`WiFi session auto-end: Transaction already exists for user ${req.user._id}, session ${activeSession._id}`);
          }
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

    // Create new session with location data
    const session = new WifiSession({
      user: req.user._id,
      ipAddress: ipAddress,
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date(location.timestamp)
      } : undefined,
      validationMethods: {
        ipAddress: isValidIP,
        location: isValidLocation
      },
      startTime: new Date(),
      sessionDate: new Date(),
      isActive: true,
    });

    await session.save();
    
    logger.info(`WiFi session started for user ${req.user._id}`, {
      ipAddress,
      campus,
      distance,
      validationMethods: { ipAddress: isValidIP, location: isValidLocation }
    });
    res.json(session);
  } catch (error) {
    logger.error('Start WiFi session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/wifi/end
// @desc    End the current active WiFi session for a user
// @access  Private (Mobile)
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
    const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10);
    
    if (durationSeconds >= minSessionDuration) {
      const pointsEarned = Math.floor(durationSeconds / 60); // 1 minute = 1 point
      
      // Check for existing transaction to prevent double point
      const existingTransaction = await Point.findOne({
        userId: req.user._id,
        type: 'WIFI_SESSION',
        'metadata.startTime': session.startTime,
        'metadata.endTime': endTime
      });
      if (!existingTransaction) {
        // Try to use transactions if available (production), fallback to sequential operations (local dev)
        let transactionSession = null;
        let useTransactions = false;
        
        try {
          // Check if transactions are supported (replica set/mongos)
          transactionSession = await mongoose.startSession();
          useTransactions = true;
        } catch (sessionError) {
          logger.info('MongoDB transactions not supported, using sequential operations');
          useTransactions = false;
        }
        
        try {
          if (useTransactions && transactionSession) {
            // Production: Use transactions for atomic operations
            await transactionSession.withTransaction(async () => {
              // Update user points and all time tracking fields
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
                },
                { session: transactionSession }
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
              await pointTransaction.save({ session: transactionSession });
              // Update session
              session.pointsEarned = pointsEarned;
            });
            logger.info(`WiFi session ended for user ${req.user._id}. Duration: ${durationSeconds}s, Points: ${pointsEarned} (with transactions)`);
          } else {
            // Local development: Sequential operations with error handling
            // Update user points and all time tracking fields
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
                startTime: session.startTime,
                endTime: endTime,
                duration: durationSeconds,
                description: `WiFi session on ${session.ipAddress}`,
              }
            });
            await pointTransaction.save();
            // Update session
            session.pointsEarned = pointsEarned;
            logger.info(`WiFi session ended for user ${req.user._id}. Duration: ${durationSeconds}s, Points: ${pointsEarned} (sequential)`);
          }
        } catch (updateError) {
          logger.error('Failed to update user points or create point transaction:', updateError);
          throw updateError;
        } finally {
          if (transactionSession) {
            await transactionSession.endSession();
          }
        }
      } else {
        logger.info(`WiFi session end: Transaction already exists for user ${req.user._id}, session ${session._id}`);
      }
    }
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
    await session.save();
    res.json({
      ...session.toObject(),
      currentDuration: session.currentDuration
    });
  } catch (error) {
    logger.error('End WiFi session error:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// @route   POST /api/wifi/background-sync
// @desc    Sync offline/background session data from mobile
// @access  Private (Mobile)
router.post('/background-sync', auth, async (req, res) => {
  try {
    const { sessionId, startTime, endTime, duration, ipAddress, location } = req.body;

    logger.info(`Background sync request: sessionId=${sessionId}, duration=${duration}s, IP=${ipAddress}, hasLocation=${!!location}`);

    // Validate required fields
    if (!sessionId || !startTime || !duration || !ipAddress) {
      return res.status(400).json({ 
        message: 'Missing required fields: sessionId, startTime, duration, ipAddress' 
      });
    }

    // Validate session data - Kiểm tra IP đã lưu trong phiên (không kiểm tra IP hiện tại của người dùng)
    if (!isValidUniversityIP(ipAddress)) {
      logger.warn(`Background sync rejected: Invalid IP ${ipAddress}`);
      return res.status(400).json({ 
        message: 'Invalid university WiFi IP address in session data' 
      });
    }

    // Validate session location if provided (không kiểm tra location hiện tại của người dùng)
    let locationValid = true;
    if (location) {
      locationValid = isValidUniversityLocation(location);
      if (!locationValid) {
        // Ghi log nhưng không từ chối đồng bộ nếu IP hợp lệ
        logger.info(`Background session ${sessionId} has invalid location data, but continuing with valid IP`);
      }
    } else {
      // Phiên cũ không có location, ghi log nhưng không từ chối đồng bộ
      logger.info(`Background session ${sessionId} has no location data (likely created before update)`);
    }

    // Enhanced duplicate session check
    const existingSession = await WifiSession.findOne({
      $or: [
        // Kiểm tra theo ID phiên
        {'metadata.backgroundSessionId': sessionId},
        // Kiểm tra theo thời gian + user + độ dài phiên (trong trường hợp sessionId không khớp)
        {
      user: req.user._id,
          startTime: {
            $gte: new Date(new Date(startTime).getTime() - 60000), // -1 phút
            $lte: new Date(new Date(startTime).getTime() + 60000)  // +1 phút
          },
          duration: { 
            $gte: parseInt(duration, 10) * 0.9, 
            $lte: parseInt(duration, 10) * 1.1 
          },
          'metadata.source': 'background'
        }
      ]
    });

    if (existingSession) {
      logger.info(`Background session ${sessionId} already synced for user ${req.user._id} (or similar session exists)`);
      return res.json({ 
        message: 'Session already synced', 
        session: existingSession,
        alreadySynced: true
      });
    }

    // Calculate points: 1 minute = 1 point
    const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10);
    const durationSeconds = parseInt(duration, 10);
    
    if (durationSeconds < minSessionDuration) {
      logger.info(`Background session ${sessionId} too short (${durationSeconds}s), not awarding points`);
      return res.json({ message: 'Session too short, no points awarded' });
    }

    const pointsEarned = Math.floor(durationSeconds / 60);

    // Reset time periods if needed
    await checkAndResetTimePeriods(req.user._id);

    // Ghi log thông tin chi tiết trước khi tạo phiên
    logger.info(`Creating new WiFi session for user ${req.user._id}: ${pointsEarned} points for ${durationSeconds}s duration`);

    // Use transactions if available
    const result = await executeWithOptionalTransaction(async (session) => {
      // Check for existing transaction to prevent double point
      const existingTransaction = await Point.findOne({
        userId: req.user._id,
        type: 'WIFI_SESSION',
        'metadata.startTime': new Date(startTime),
        'metadata.endTime': endTime ? new Date(endTime) : new Date()
      });
      if (!existingTransaction) {
        // Create WiFi session record with location if available
        const wifiSession = new WifiSession({
          user: req.user._id,
          ipAddress,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : new Date(),
          duration: durationSeconds,
          pointsEarned,
          sessionDate: new Date(startTime),
          isActive: false,
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date(location.timestamp || startTime)
          } : undefined,
          metadata: {
            backgroundSessionId: sessionId,
            syncedAt: new Date(),
            source: 'background',
            validationMethods: {
              ipAddress: true,
              location: locationValid
            }
          }
        });

        await wifiSession.save(session ? { session } : {});

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
          },
          session ? { session } : {}
        );
        
        // Create point transaction record
        const pointTransaction = new Point({
          userId: req.user._id,
          amount: pointsEarned,
          type: 'WIFI_SESSION',
          metadata: {
            backgroundSessionId: sessionId,
            startTime: new Date(startTime),
            endTime: endTime ? new Date(endTime) : new Date(),
            duration: durationSeconds,
            description: `Background WiFi session on ${ipAddress}`,
            location: location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : undefined,
            validationMethods: {
              ipAddress: true,
              location: locationValid
            }
          }
        });

        await pointTransaction.save(session ? { session } : {});

        return wifiSession;
      } else {
        logger.info(`Background sync: Transaction already exists for user ${req.user._id}, sessionId ${sessionId}`);
        return existingSession;
      }
    });

    logger.info(`Background session synced: ${sessionId} for user ${req.user._id}, points: ${pointsEarned}`);
    res.json({ 
      message: 'Background session synced successfully', 
      session: result,
      pointsEarned 
    });

  } catch (error) {
    logger.error('Background sync error:', error);
    res.status(500).json({ message: 'Failed to sync background session', error: error.message });
  }
});

// @route   GET /api/wifi/active
// @desc    Get the current active session for a user
// @access  Private (Mobile)
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

// @route   GET /api/wifi/history
// @desc    Get the session history for a user
// @access  Private (Mobile)
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

// @route   GET /api/wifi/stats
// @desc    Get WiFi connection statistics for a user
// @access  Private (Mobile)
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

// @route   POST /api/wifi/sync
// @desc    Manual sync route to ensure user's data consistency
// @access  Private (Mobile)
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

// =================================================================
// ==                     ADMIN-ONLY APIS                       ==
// =================================================================

// @route   GET /api/wifi/sessions
// @desc    Get all WiFi sessions (for admin dashboard)
// @access  Private (Admin)
router.get('/sessions', authAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'startTime', order = 'desc', status, userId } = req.query;

    const query = {};
    if (status) query.isActive = status === 'active';
    if (userId) query.user = userId;

    const sessions = await WifiSession.find(query)
      .populate('user', 'fullname nickname studentId')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await WifiSession.countDocuments(query);

    res.json({
      sessions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error('Admin get WiFi sessions error:', error);
    res.status(500).json({ message: 'Server error fetching WiFi sessions' });
  }
});

// @route   GET /api/wifi/sessions/:id
// @desc    Get a single WiFi session by ID (for admin)
// @access  Private (Admin)
router.get('/sessions/:id', authAdmin, async (req, res) => {
  try {
    const session = await WifiSession.findById(req.params.id).populate('user', 'fullname nickname studentId');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    logger.error('Admin get WiFi session by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =================================================================
// ==                  DEPRECATED/UNUSED APIS                   ==
// =================================================================

// Note: The following routes were identified as potentially unused by the latest clients.
// Please verify they are no longer needed before deleting them manually.

// @route   POST /api/wifi/update
// @desc    (DEPRECATED?) Update active session (for real-time tracking)
// @access  Private
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

// @route   GET /api/wifi/session-count
// @desc    (DEPRECATED?) Get current session count for the day
// @access  Private
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

// @route   POST /api/wifi/cleanup
// @desc    (DEPRECATED?) Cleanup orphaned sessions for a user
// @access  Private
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

module.exports = router; 

// =================================================================
// ==                MANUAL DELETION CHECKLIST                ==
// =================================================================
// The following routes were identified as potentially deprecated or unused.
// Please verify they are no longer needed before deleting them manually.
// 1. POST /api/wifi/update
// 2. GET /api/wifi/session-count
// 3. POST /api/wifi/cleanup
// =================================================================
