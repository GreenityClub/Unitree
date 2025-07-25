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
          $match: { type: { $in: ['earned', 'admin_adjustment', 'bonus'] } }
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

module.exports = router; 