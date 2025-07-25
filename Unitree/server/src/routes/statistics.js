const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tree = require('../models/Tree');
const RealTree = require('../models/RealTree');
const WifiSession = require('../models/WifiSession');
const Point = require('../models/Point');
const { authAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// =================================================================
// ==                  STATISTICS & DASHBOARD APIS                ==
// =================================================================

/**
 * @route   GET /api/statistics/overview
 * @desc    Get an overview of key statistics for the admin dashboard
 * @access  Private (Admin)
 */
router.get('/overview', authAdmin, async (req, res) => {
  try {
    // Use Promise.all to run all queries in parallel for better performance
    const [
      totalUsers,
      totalVirtualTrees,
      totalRealTrees,
      wifiSessionsData,
      totalPointsEarned,
      recentUsers
    ] = await Promise.all([
      // Count total users
      User.countDocuments(),
      
      // Count total virtual trees
      Tree.countDocuments(),
      
      // Count total real trees
      RealTree.countDocuments(),
      
      // Get total WiFi hours (convert minutes to hours)
      WifiSession.aggregate([
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: "$duration" }
          }
        }
      ]),
      
      // Get total points earned
      Point.aggregate([
        {
          $match: { type: { $in: ['WIFI_SESSION', 'BONUS', 'ADMIN_ADJUSTMENT', 'ACHIEVEMENT'] } }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]),
      
      // Get 5 most recently registered users
      User.find()
        .select('fullname email createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate total WiFi hours (convert minutes to hours)
    const totalWifiHours = wifiSessionsData.length > 0 
      ? Math.round(wifiSessionsData[0].totalMinutes / 60) 
      : 0;

    // Get total points value
    const totalPoints = totalPointsEarned.length > 0 
      ? totalPointsEarned[0].total 
      : 0;

    res.json({
      totalUsers,
      totalVirtualTrees,
      totalRealTrees,
      totalWifiHours,
      totalPointsEarned: totalPoints,
      recentUsers
    });
  } catch (err) {
    logger.error('Error fetching statistics overview:', err);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

/**
 * @route   GET /api/statistics/monthly
 * @desc    Get monthly statistics for charts
 * @access  Private (Admin)
 */
router.get('/monthly', authAdmin, async (req, res) => {
  try {
    // Get current date and calculate date 6 months ago
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    // Get monthly stats for the past 6 months
    const [userStats, treeStats, pointStats, sessionStats] = await Promise.all([
      // Monthly user registrations
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // Monthly tree creations
      Tree.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // Monthly points earned
      Point.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            type: { $in: ['earned', 'admin_adjustment', 'bonus'] }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            total: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      
      // Monthly WiFi sessions
      WifiSession.aggregate([
        {
          $match: {
            startTime: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: "$startTime" },
              month: { $month: "$startTime" }
            },
            count: { $sum: 1 },
            totalMinutes: { $sum: "$duration" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);
    
    // Process and format the data for the frontend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = [];
    
    // Generate the past 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // JavaScript months are 0-based
      months.unshift({ year, month });
    }
    
    // Map the data to each month
    const monthlyData = months.map(({ year, month }) => {
      // Find matching stats for this month
      const users = userStats.find(stat => 
        stat._id.year === year && stat._id.month === month
      )?.count || 0;
      
      const trees = treeStats.find(stat => 
        stat._id.year === year && stat._id.month === month
      )?.count || 0;
      
      const points = pointStats.find(stat => 
        stat._id.year === year && stat._id.month === month
      )?.total || 0;
      
      const sessionData = sessionStats.find(stat => 
        stat._id.year === year && stat._id.month === month
      );
      
      const sessions = sessionData?.count || 0;
      const hours = sessionData ? Math.round(sessionData.totalMinutes / 60) : 0;
      
      return {
        month: monthNames[month - 1],
        year,
        students: users,
        trees,
        points,
        sessions,
        hours
      };
    });
    
    res.json(monthlyData);
  } catch (err) {
    logger.error('Error fetching monthly statistics:', err);
    res.status(500).json({ message: 'Server error while fetching monthly statistics' });
  }
});

/**
 * @route   GET /api/statistics/tree-types
 * @desc    Get distribution of tree types
 * @access  Private (Admin)
 */
router.get('/tree-types', authAdmin, async (req, res) => {
  try {
    const treeTypeDistribution = await Tree.aggregate([
      {
        $group: {
          _id: "$species",
          value: { $sum: 1 }
        }
      },
      {
        $sort: { value: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1
        }
      }
    ]);

    res.json(treeTypeDistribution);
  } catch (err) {
    logger.error('Error fetching tree type distribution:', err);
    res.status(500).json({ message: 'Server error while fetching tree type distribution' });
  }
});

/**
 * @route   GET /api/statistics/user-activity
 * @desc    Get user activity by hour
 * @access  Private (Admin)
 */
router.get('/user-activity', authAdmin, async (req, res) => {
  try {
    const userActivity = await WifiSession.aggregate([
      {
        $project: {
          hour: { $hour: "$startTime" }
        }
      },
      {
        $group: {
          _id: "$hour",
          active: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          hour: { 
            $concat: [
              { $cond: [{ $lt: ["$_id", 10] }, { $concat: ["0", { $toString: "$_id" }] }, { $toString: "$_id" }] },
              ":00"
            ]
          },
          active: 1
        }
      }
    ]);

    // Fill in missing hours with zero activity
    const result = Array.from({ length: 24 }, (_, i) => {
      const hour = i < 10 ? `0${i}:00` : `${i}:00`;
      const found = userActivity.find(item => item.hour === hour);
      return found || { hour, active: 0 };
    });

    res.json(result);
  } catch (err) {
    logger.error('Error fetching user activity by hour:', err);
    res.status(500).json({ message: 'Server error while fetching user activity' });
  }
});

/**
 * @route   GET /api/statistics/points-distribution
 * @desc    Get distribution of points by source
 * @access  Private (Admin)
 */
router.get('/points-distribution', authAdmin, async (req, res) => {
  try {
    const pointsDistribution = await Point.aggregate([
      {
        $group: {
          _id: "$type",
          value: { $sum: "$amount" }
        }
      },
      {
        $match: {
          value: { $gt: 0 }  // Only include positive points
        }
      },
      {
        $sort: { value: -1 }
      },
      {
        $project: {
          _id: 0,
          name: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", "WIFI_SESSION"] }, then: "WiFi Sessions" },
                { case: { $eq: ["$_id", "TREE_REDEMPTION"] }, then: "Tree Planting" },
                { case: { $eq: ["$_id", "REAL_TREE_REDEMPTION"] }, then: "Real Tree Planting" },
                { case: { $eq: ["$_id", "ADMIN_ADJUSTMENT"] }, then: "Admin Adjustments" },
                { case: { $eq: ["$_id", "ATTENDANCE"] }, then: "Attendance" },
                { case: { $eq: ["$_id", "ACHIEVEMENT"] }, then: "Achievements" },
                { case: { $eq: ["$_id", "BONUS"] }, then: "Bonuses" }
              ],
              default: "Other"
            }
          },
          value: 1
        }
      }
    ]);

    // Calculate total to convert to percentages
    const total = pointsDistribution.reduce((sum, item) => sum + item.value, 0);
    
    // Convert values to percentages
    const result = pointsDistribution.map(item => ({
      name: item.name,
      value: Math.round((item.value / total) * 100)
    }));

    res.json(result);
  } catch (err) {
    logger.error('Error fetching points distribution:', err);
    res.status(500).json({ message: 'Server error while fetching points distribution' });
  }
});

/**
 * @route   GET /api/statistics/daily-sessions
 * @desc    Get daily WiFi sessions for the past month
 * @access  Private (Admin)
 */
router.get('/daily-sessions', authAdmin, async (req, res) => {
  try {
    // Get current date and calculate date 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const dailySessions = await WifiSession.aggregate([
      {
        $match: {
          startTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$startTime" },
            month: { $month: "$startTime" },
            day: { $dayOfMonth: "$startTime" }
          },
          sessions: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      },
      {
        $project: {
          _id: 0,
          date: { 
            $concat: [
              { $toString: "$_id.day" }, 
              "/", 
              { $toString: "$_id.month" }
            ] 
          },
          sessions: 1
        }
      }
    ]);

    // Fill in missing days with zero sessions
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
      
      const found = dailySessions.find(item => item.date === dateStr);
      result.push(found || { date: dateStr, sessions: 0 });
    }

    res.json(result);
  } catch (err) {
    logger.error('Error fetching daily sessions:', err);
    res.status(500).json({ message: 'Server error while fetching daily sessions' });
  }
});

/**
 * @route   GET /api/statistics/wifi-hours
 * @desc    Get detailed WiFi usage statistics
 * @access  Private (Admin)
 */
router.get('/wifi-hours', authAdmin, async (req, res) => {
  try {
    // Fetch total WiFi hours
    const [
      totalHoursData,
      hoursByDayOfWeek,
      top10Users,
      dailyAverages,
      monthlyTrend
    ] = await Promise.all([
      // Total hours
      WifiSession.aggregate([
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: "$duration" },
            sessionCount: { $sum: 1 }
          }
        }
      ]),
      
      // Hours by day of week
      WifiSession.aggregate([
        {
          $project: {
            dayOfWeek: { $dayOfWeek: "$startTime" }, // 1 for Sunday, 2 for Monday, etc.
            duration: 1
          }
        },
        {
          $group: {
            _id: "$dayOfWeek",
            minutes: { $sum: "$duration" },
            sessions: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                  { case: { $eq: ["$_id", 2] }, then: "Monday" },
                  { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                  { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                  { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                  { case: { $eq: ["$_id", 6] }, then: "Friday" },
                  { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                ],
                default: "Unknown"
              }
            },
            hours: { $round: [{ $divide: ["$minutes", 60] }, 1] },
            sessions: 1
          }
        }
      ]),
      
      // Top 10 users by WiFi hours
      WifiSession.aggregate([
        {
          $group: {
            _id: "$userId",
            minutes: { $sum: "$duration" },
            sessions: { $sum: 1 }
          }
        },
        {
          $sort: { minutes: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            fullname: "$user.fullname",
            email: "$user.email",
            hours: { $round: [{ $divide: ["$minutes", 60] }, 1] },
            sessions: 1
          }
        }
      ]),
      
      // Daily average over time (last 30 days)
      WifiSession.aggregate([
        {
          $match: {
            startTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $project: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
            duration: 1
          }
        },
        {
          $group: {
            _id: "$date",
            minutes: { $sum: "$duration" },
            sessions: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            hours: { $round: [{ $divide: ["$minutes", 60] }, 1] },
            sessions: 1
          }
        }
      ]),
      
      // Monthly trend (last 6 months)
      WifiSession.aggregate([
        {
          $match: {
            startTime: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $project: {
            yearMonth: { $dateToString: { format: "%Y-%m", date: "$startTime" } },
            duration: 1
          }
        },
        {
          $group: {
            _id: "$yearMonth",
            minutes: { $sum: "$duration" },
            sessions: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            hours: { $round: [{ $divide: ["$minutes", 60] }, 1] },
            sessions: 1
          }
        }
      ])
    ]);

    // Process total hours data
    const totalHours = totalHoursData.length > 0 
      ? Math.round(totalHoursData[0].totalMinutes / 60) 
      : 0;
    
    const sessionCount = totalHoursData.length > 0
      ? totalHoursData[0].sessionCount
      : 0;
    
    const avgSessionDuration = sessionCount > 0
      ? Math.round((totalHoursData[0].totalMinutes / sessionCount) / 60 * 100) / 100
      : 0;

    res.json({
      totalHours,
      sessionCount,
      avgSessionDuration,
      byDayOfWeek: hoursByDayOfWeek,
      topUsers: top10Users,
      dailyAverages: dailyAverages,
      monthlyTrend: monthlyTrend
    });
  } catch (err) {
    logger.error('Error fetching WiFi hours statistics:', err);
    res.status(500).json({ message: 'Server error while fetching WiFi statistics' });
  }
});

/**
 * @route   GET /api/statistics/points-earned
 * @desc    Get detailed points earned statistics
 * @access  Private (Admin)
 */
router.get('/points-earned', authAdmin, async (req, res) => {
  try {
    // Fetch points earned data
    const [
      totalPoints,
      pointsByType,
      pointsByDay,
      top10Users,
      monthlyTrend
    ] = await Promise.all([
      // Total points earned
      Point.aggregate([
        {
          $match: {
            amount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Points by type
      Point.aggregate([
        {
          $match: {
            amount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: "$type",
            points: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { points: -1 }
        },
        {
          $project: {
            _id: 0,
            type: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", "WIFI_SESSION"] }, then: "WiFi Sessions" },
                  { case: { $eq: ["$_id", "TREE_REDEMPTION"] }, then: "Tree Planting" },
                  { case: { $eq: ["$_id", "REAL_TREE_REDEMPTION"] }, then: "Real Tree Planting" },
                  { case: { $eq: ["$_id", "ADMIN_ADJUSTMENT"] }, then: "Admin Adjustments" },
                  { case: { $eq: ["$_id", "ATTENDANCE"] }, then: "Attendance" },
                  { case: { $eq: ["$_id", "ACHIEVEMENT"] }, then: "Achievements" },
                  { case: { $eq: ["$_id", "BONUS"] }, then: "Bonuses" }
                ],
                default: "$_id"
              }
            },
            points: 1,
            count: 1,
            percentage: { $round: [{ $multiply: [{ $divide: ["$points", { $sum: "$points" }] }, 100] }, 1] }
          }
        }
      ]),
      
      // Points by day of week
      Point.aggregate([
        {
          $match: {
            amount: { $gt: 0 }
          }
        },
        {
          $project: {
            dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1 for Sunday, 2 for Monday, etc.
            amount: 1
          }
        },
        {
          $group: {
            _id: "$dayOfWeek",
            points: { $sum: "$amount" },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                  { case: { $eq: ["$_id", 2] }, then: "Monday" },
                  { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                  { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                  { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                  { case: { $eq: ["$_id", 6] }, then: "Friday" },
                  { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                ],
                default: "Unknown"
              }
            },
            points: 1,
            transactions: 1
          }
        }
      ]),
      
      // Top 10 users by points earned
      Point.aggregate([
        {
          $match: {
            amount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: "$userId",
            points: { $sum: "$amount" },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { points: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            fullname: "$user.fullname",
            email: "$user.email",
            points: 1,
            transactions: 1
          }
        }
      ]),
      
      // Monthly trend (last 6 months)
      Point.aggregate([
        {
          $match: {
            amount: { $gt: 0 },
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $project: {
            yearMonth: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            amount: 1
          }
        },
        {
          $group: {
            _id: "$yearMonth",
            points: { $sum: "$amount" },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            points: 1,
            transactions: 1
          }
        }
      ])
    ]);

    // Process total points data
    const totalPointsEarned = totalPoints.length > 0 
      ? totalPoints[0].total 
      : 0;
    
    const totalTransactions = totalPoints.length > 0
      ? totalPoints[0].count
      : 0;
    
    const avgPointsPerTransaction = totalTransactions > 0
      ? Math.round((totalPointsEarned / totalTransactions) * 100) / 100
      : 0;

    res.json({
      totalPointsEarned,
      totalTransactions,
      avgPointsPerTransaction,
      byType: pointsByType,
      byDayOfWeek: pointsByDay,
      topUsers: top10Users,
      monthlyTrend: monthlyTrend
    });
  } catch (err) {
    logger.error('Error fetching points earned statistics:', err);
    res.status(500).json({ message: 'Server error while fetching points statistics' });
  }
});

module.exports = router; 