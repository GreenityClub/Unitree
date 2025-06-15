const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, university } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (university) user.university = university;

    await user.save();
    res.json(user);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user points
router.get('/points', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('points');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ points: user.points });
  } catch (error) {
    logger.error('Get points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's trees
router.get('/trees', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('trees')
      .select('trees');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ trees: user.trees });
  } catch (error) {
    logger.error('Get trees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 