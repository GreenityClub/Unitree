const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Point = require('../models/Point');
const logger = require('../utils/logger');

// =================================================================
// ==                      MOBILE-ONLY APIS                     ==
// =================================================================

// @route   GET /api/points
// @desc    Get user's points and recent transaction history
// @access  Private (Mobile)
router.get('/', auth, async (req, res) => {
  try {
    const points = await Point.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const user = await User.findById(req.user._id).select('points allTimePoints');

    res.json({
      points: user.points,
      allTimePoints: user.allTimePoints,
      transactions: points
    });
  } catch (error) {
    logger.error('Error fetching points:', error);
    res.status(500).json({ message: 'Error fetching points' });
  }
});

// =================================================================
// ==                     ADMIN-ONLY APIS                       ==
// =================================================================

// @route   GET /api/points/admin/all
// @desc    Get all points transactions (for admin)
// @access  Private (Admin)
router.get('/admin/all', authAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, userId } = req.query;
        const query = userId ? { userId } : {};

        const points = await Point.find(query)
            .populate('userId', 'fullname nickname')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit));
        
        const total = await Point.countDocuments(query);

        res.json({
            transactions: points,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        logger.error('Admin get all points error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/points/admin/adjust
// @desc    Adjust a user's points (for admin)
// @access  Private (Admin)
router.post('/admin/adjust', authAdmin, async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        if (!userId || !amount || !reason) {
            return res.status(400).json({ message: 'userId, amount, and reason are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pointTransaction = new Point({
            userId,
            amount,
            type: 'ADMIN_ADJUSTMENT',
            metadata: { reason, adminId: req.admin._id }
        });
        await pointTransaction.save();

        user.points += amount;
        user.allTimePoints += amount > 0 ? amount : 0;
        await user.save();

        res.json({
            message: 'Points adjusted successfully',
            user,
            transaction: pointTransaction
        });
    } catch (error) {
        logger.error('Admin adjust points error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/points/admin/:id
// @desc    Delete a point transaction and update user points (for admin)
// @access  Private (Admin)
router.delete('/admin/:id', authAdmin, async (req, res) => {
    try {
        const pointTransaction = await Point.findById(req.params.id);
        if (!pointTransaction) {
            return res.status(404).json({ message: 'Point transaction not found' });
        }

        // Get the user associated with this transaction
        const user = await User.findById(pointTransaction.userId);
        if (!user) {
            return res.status(404).json({ message: 'User associated with this transaction not found' });
        }

        // Update user points by reversing the transaction
        // If it was a positive transaction, subtract points from both current and all-time points
        // If it was a negative transaction, add points back to current points only
        user.points -= pointTransaction.amount;
        
        // Update allTimePoints - only subtract if the original transaction was positive
        // This ensures lifetime earnings are accurate
        if (pointTransaction.amount > 0) {
            user.allTimePoints -= pointTransaction.amount;
        }

        // Make sure points don't go negative
        if (user.points < 0) user.points = 0;
        if (user.allTimePoints < 0) user.allTimePoints = 0;

        // Save the updated user and delete the transaction
        await user.save();
        await Point.findByIdAndDelete(req.params.id);

        logger.info(`Admin deleted point transaction ${req.params.id}, updated user ${user._id} points to ${user.points}, allTimePoints to ${user.allTimePoints}`);

        res.json({
            message: 'Point transaction deleted and user points updated',
            user: {
                id: user._id,
                points: user.points,
                allTimePoints: user.allTimePoints
            }
        });
    } catch (error) {
        logger.error('Admin delete point transaction error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// =================================================================
// ==                  DEPRECATED/UNUSED APIS                   ==
// =================================================================

// Note: This attendance endpoint seems specific and might not be in general use.
// Please verify its usage before considering removal.

// @route   POST /api/points/attendance
// @desc    (DEPRECATED?) Add points for attendance
// @access  Private
router.post('/attendance', auth, async (req, res) => {
  try {
    const { duration, startTime, endTime } = req.body;
    const pointsEarned = Math.floor(duration * (process.env.POINTS_PER_HOUR || 10)); // Default to 10 points per hour

    const pointTransaction = new Point({
      userId: req.user._id,
      amount: pointsEarned,
      type: 'ATTENDANCE',
      metadata: { startTime, endTime, duration }
    });
    await pointTransaction.save();

    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { points: pointsEarned, allTimePoints: pointsEarned } }
    );

    res.json({
      points: pointsEarned,
      transaction: pointTransaction
    });
  } catch (error) {
    logger.error('Error adding attendance points:', error);
    res.status(500).json({ message: 'Error adding points' });
  }
});

module.exports = router;

// =================================================================
// ==                MANUAL DELETION CHECKLIST                ==
// =================================================================
// The following routes were identified as potentially deprecated or unused.
// Please verify they are no longer needed before deleting them manually.
// 1. POST /api/points/attendance
// ================================================================= 