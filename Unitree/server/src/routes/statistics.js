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
    const [
      totalUsers,
      totalVirtualTrees,
      totalRealTrees,
      totalWifiHours,
      totalPointsEarned,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Tree.countDocuments(),
      RealTree.countDocuments(),
      WifiSession.aggregate([
        { $group: { _id: null, totalDuration: { $sum: '$duration' } } },
      ]),
      Point.aggregate([
        { $match: { amount: { $gt: 0 } } },
        { $group: { _id: null, totalPoints: { $sum: '$amount' } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('fullname email createdAt'),
    ]);

    const stats = {
      totalUsers,
      totalVirtualTrees,
      totalRealTrees,
      totalWifiHours: totalWifiHours.length > 0 ? Math.floor(totalWifiHours[0].totalDuration / 3600) : 0,
      totalPointsEarned: totalPointsEarned.length > 0 ? totalPointsEarned[0].totalPoints : 0,
      recentUsers,
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching statistics overview:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router; 