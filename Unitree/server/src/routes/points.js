const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Point = require('../models/Point');

// Get user's points and transaction history
router.get('/', auth, async (req, res) => {
  try {
    const points = await Point.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const totalPoints = await User.findById(req.user._id).select('points');

    res.json({
      points: totalPoints.points,
      transactions: points
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({ message: 'Error fetching points' });
  }
});

// Add points for attendance
router.post('/attendance', auth, async (req, res) => {
  try {
    const { duration, startTime, endTime } = req.body;
    const pointsEarned = Math.floor(duration * process.env.POINTS_PER_HOUR);

    const pointTransaction = new Point({
      userId: req.user._id,
      amount: pointsEarned,
      type: 'ATTENDANCE',
      metadata: {
        startTime,
        endTime,
        duration
      }
    });

    await pointTransaction.save();

    // Update user's total points and all-time points
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $inc: { 
          points: pointsEarned,
          allTimePoints: pointsEarned 
        } 
      }
    );

    res.json({
      points: pointsEarned,
      transaction: pointTransaction
    });
  } catch (error) {
    console.error('Error adding attendance points:', error);
    res.status(500).json({ message: 'Error adding points' });
  }
});

module.exports = router; 