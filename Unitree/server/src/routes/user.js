const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Point = require('../models/Point');
const Tree = require('../models/Tree');
const WifiSession = require('../models/WifiSession');
const upload = require('../services/cloudStorage').upload;
const logger = require('../utils/logger');
const fs = require('fs');

// =================================================================
// ==                        SHARED APIS                        ==
// =================================================================

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    logger.error('Get profile error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullname, nickname, university } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullname) user.fullname = fullname;
    if (nickname) user.nickname = nickname;
    if (university) user.university = university;

    await user.save();
    res.json(user);
  } catch (err) {
    logger.error('Update profile error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // The upload middleware now directly provides the cloud URL in req.file.path
    const avatarUrl = req.file.path;
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: false }
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      user: updatedUser
    });
  } catch (err) {
    logger.error('Avatar upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      // This part might be obsolete if temp files are handled by the upload service
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/avatar
// @desc    Delete user avatar
// @access  Private
router.delete('/avatar', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // The logic to delete from cloud storage should be handled here or in a service
        
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { avatar: null },
            { new: true, runValidators: false }
        );

        res.json({ 
            message: 'Avatar deleted successfully',
            user: updatedUser
        });
    } catch (err) {
        logger.error('Delete avatar error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/account', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        logger.info(`Starting account deletion for user: ${userId}`);
    
        await Point.deleteMany({ userId: userId });
        await Tree.deleteMany({ userId: userId });
        await WifiSession.deleteMany({ userId: userId });
        // Avatar file deletion from cloud should be handled here
    
        await User.findByIdAndDelete(userId);
        logger.info(`User account ${userId} deleted successfully`);
    
        res.json({ message: 'Account deleted successfully' });
      } catch (err) {
        logger.error('Delete account error:', err);
        res.status(500).send('Server Error');
      }
});

// =================================================================
// ==                      MOBILE-ONLY APIS                     ==
// =================================================================

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard, used by Mobile App
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
    try {
      const { period = 'all-time' } = req.query;
      
      if (period === 'monthly') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
  
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  
        const monthlyPoints = await Point.aggregate([
          { $match: { createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
          { $group: { _id: '$userId', monthlyPoints: { $sum: '$amount' } } },
          { $sort: { monthlyPoints: -1 } },
          { $limit: 100 }
        ]);
  
        const userIds = monthlyPoints.map(p => p._id);
        const users = await User.find({ _id: { $in: userIds } }).select('fullname nickname email avatar');
  
        const userMap = users.reduce((map, user) => {
          map[user._id.toString()] = user;
          return map;
        }, {});
  
        const leaderboard = monthlyPoints.map((point, index) => {
          const user = userMap[point._id.toString()];
          return user ? {
            rank: index + 1,
            id: user._id.toString(),
            fullname: user.fullname,
            nickname: user.nickname,
            avatar: user.avatar,
            monthlyPoints: point.monthlyPoints || 0,
          } : null;
        }).filter(Boolean);
  
        const currentUserRank = leaderboard.findIndex(u => u.id === req.user._id.toString()) + 1;
  
        res.json({ leaderboard, userRank: currentUserRank > 0 ? currentUserRank : null });
  
      } else { // all-time
        const users = await User.find({})
          .sort({ allTimePoints: -1 })
          .limit(100)
          .select('fullname nickname email avatar allTimePoints');
  
        const leaderboard = users.map((user, index) => ({
          rank: index + 1,
          id: user._id.toString(),
          fullname: user.fullname,
          nickname: user.nickname,
          avatar: user.avatar,
          allTimePoints: user.allTimePoints || 0,
        }));
  
        const currentUserRank = leaderboard.findIndex(u => u.id === req.user._id.toString()) + 1;
  
        res.json({ leaderboard, userRank: currentUserRank > 0 ? currentUserRank : null });
      }
    } catch (err) {
      logger.error('Leaderboard error:', err);
      res.status(500).send('Server Error');
    }
  });

// =================================================================
// ==                     ADMIN-ONLY APIS                       ==
// =================================================================

// @route   GET /api/users
// @desc    Get all users (admin only) with pagination, search, and sorting
// @access  Private (Admin)
router.get('/', authAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = search
      ? {
          $or: [
            { fullname: { $regex: search, $options: 'i' } },
            { nickname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    logger.error('Get all users error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (Admin)
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    logger.error(`Get user by ID error: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (admin only)
// @access  Private (Admin)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Deleting user and their related data
    await Point.deleteMany({ userId: req.params.id });
    await Tree.deleteMany({ userId: req.params.id });
    await WifiSession.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User and all related data removed' });
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 