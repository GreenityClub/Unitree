const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');
const cloudStorage = require('../services/cloudStorage');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Use consistent filename pattern: avatar-{userId}.{extension}
    const userId = req.user ? req.user._id : 'unknown';
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `avatar-${userId}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
    }
  }
});

// Utility functions for avatar management
const avatarUtils = {
  // Get all possible avatar file patterns for a user
  getPossibleAvatarPaths: (userId) => {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
    return extensions.map(ext => `uploads/avatars/avatar-${userId}${ext}`);
  },

  // Clean up all avatar files for a user
  cleanupUserAvatars: (userId) => {
    const possiblePaths = avatarUtils.getPossibleAvatarPaths(userId);
    possiblePaths.forEach(avatarPath => {
      const fullPath = path.join(__dirname, '../..', avatarPath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Cleaned up avatar: ${avatarPath}`);
        } catch (error) {
          console.error(`Error cleaning up avatar ${avatarPath}:`, error);
        }
      }
    });
  },

  // Clean up avatar files for a user, excluding a specific filename
  cleanupUserAvatarsExcept: (userId, excludeFilename) => {
    const possiblePaths = avatarUtils.getPossibleAvatarPaths(userId);
    possiblePaths.forEach(avatarPath => {
      const fullPath = path.join(__dirname, '../..', avatarPath);
      const filename = path.basename(avatarPath);
      
      // Skip the file we want to keep
      if (filename === excludeFilename) {
        console.log(`Keeping current avatar: ${avatarPath}`);
        return;
      }
      
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Cleaned up old avatar: ${avatarPath}`);
        } catch (error) {
          console.error(`Error cleaning up avatar ${avatarPath}:`, error);
        }
      }
    });
  },

  // Check if an avatar file actually exists
  avatarExists: (avatarPath) => {
    if (!avatarPath) return false;
    const fullPath = path.join(__dirname, '../..', avatarPath);
    return fs.existsSync(fullPath);
  },

  // Validate and clean up user avatar reference
  validateUserAvatar: async (userId) => {
    const user = await User.findById(userId);
    if (user && user.avatar && !avatarUtils.avatarExists(user.avatar)) {
      // Avatar file doesn't exist, clear the database reference
      await User.findByIdAndUpdate(userId, { avatar: null }, { runValidators: false });
      console.log(`Cleared invalid avatar reference for user ${userId}`);
      return null;
    }
    return user ? user.avatar : null;
  }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate avatar existence and clean up if necessary
    if (user.avatar && !avatarUtils.avatarExists(user.avatar)) {
      console.log(`Avatar file missing for user ${user._id}, clearing reference`);
      user.avatar = null;
      await User.findByIdAndUpdate(user._id, { avatar: null }, { runValidators: false });
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
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user points
router.get('/points', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('points');
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
    const user = await User.findById(req.user._id)
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

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Use the authenticated user from the auth middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let avatarUrl;
    let avatarPath;

    if (cloudStorage.isAvailable()) {
      // Use cloud storage (Cloudinary)
      try {
        // Delete existing cloud avatar if exists
        const existingUser = await User.findById(user._id);
        if (existingUser.avatar && existingUser.avatar.includes('cloudinary.com')) {
          // Extract public_id from Cloudinary URL to delete old avatar
          const publicId = `unitree/avatars/avatar-${user._id}`;
          await cloudStorage.deleteAvatar(publicId);
        }

        // Upload to cloud storage
        const uploadResult = await cloudStorage.uploadAvatar(req.file.path, user._id);
        avatarUrl = uploadResult.url;
        avatarPath = uploadResult.url; // Store the full URL for cloud storage

        // Clean up local temp file
        fs.unlinkSync(req.file.path);
        
        logger.info(`Avatar uploaded to cloud storage for user ${user._id}`);
      } catch (cloudError) {
        logger.error('Cloud storage failed, falling back to local storage:', cloudError);
        // Fall back to local storage
        avatarUtils.cleanupUserAvatarsExcept(user._id, req.file.filename);
        avatarPath = `uploads/avatars/${req.file.filename}`;
        avatarUrl = avatarPath;
      }
    } else {
      // Use local storage (fallback)
      avatarUtils.cleanupUserAvatarsExcept(user._id, req.file.filename);
      avatarPath = `uploads/avatars/${req.file.filename}`;
      avatarUrl = avatarPath;
      logger.info(`Avatar uploaded to local storage for user ${user._id}`);
    }
    
    // Use findByIdAndUpdate to update only the avatar field
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatar: avatarPath },
      { new: true, runValidators: false } // Skip validation for this update
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
      avatarUrl: avatarUrl,
      user: updatedUser,
      storage: cloudStorage.isAvailable() ? 'cloud' : 'local'
    });
  } catch (error) {
    logger.error('Upload avatar error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      // Clean up uploaded file if error occurs
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete avatar
router.delete('/avatar', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current user to check avatar URL
    const existingUser = await User.findById(user._id);
    
    if (existingUser.avatar) {
      if (cloudStorage.isAvailable() && existingUser.avatar.includes('cloudinary.com')) {
        // Delete from cloud storage
        try {
          const publicId = `unitree/avatars/avatar-${user._id}`;
          await cloudStorage.deleteAvatar(publicId);
          logger.info(`Avatar deleted from cloud storage for user ${user._id}`);
        } catch (cloudError) {
          logger.error('Failed to delete avatar from cloud storage:', cloudError);
        }
      } else {
        // Delete from local storage
        avatarUtils.cleanupUserAvatars(user._id);
        logger.info(`Avatar deleted from local storage for user ${user._id}`);
      }
    }

    // Use findByIdAndUpdate to avoid validation issues
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatar: null },
      { new: true, runValidators: false }
    );

    res.json({ 
      message: 'Avatar deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Delete avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { period = 'all-time' } = req.query; // Default to all-time
    
    if (period === 'monthly') {
      // Monthly leaderboard logic
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Aggregate points for this month from Point model
      const Point = require('../models/Point');
      const monthlyPoints = await Point.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lte: endOfMonth
            }
          }
        },
        {
          $group: {
            _id: '$userId',
            monthlyPoints: { $sum: '$amount' }
          }
        },
        {
          $sort: { monthlyPoints: -1 }
        },
        {
          $limit: 100
        }
      ]);

      // Get user details for monthly leaders
      const userIds = monthlyPoints.map(p => p._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('fullname nickname email avatar totalTimeConnected');

      // Create user lookup map
      const userMap = {};
      users.forEach(user => {
        userMap[user._id.toString()] = user;
      });

      // Build monthly leaderboard
      const leaderboard = monthlyPoints.map((point, index) => {
        const user = userMap[point._id.toString()];
        if (!user) return null;
        
        return {
          rank: index + 1,
          id: user._id.toString(),
          _id: user._id,
          fullname: user.fullname,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          monthlyPoints: point.monthlyPoints || 0,
          totalWifiTimeSeconds: user.totalTimeConnected || 0,
          totalWifiTimeFormatted: formatWifiTime(user.totalTimeConnected || 0)
        };
      }).filter(Boolean);

      // Find current user's rank in monthly leaderboard
      const currentUserRank = leaderboard.findIndex(user => user._id.toString() === req.user._id.toString()) + 1;

      res.json({
        leaderboard,
        userRank: currentUserRank > 0 ? currentUserRank : null,
        totalUsers: leaderboard.length,
        currentUserId: req.user._id.toString(),
        period: 'monthly'
      });

    } else {
      // All-time leaderboard logic (existing)
      const users = await User.find({})
        .sort({ allTimePoints: -1 }) // Sort by all-time points earned
        .limit(100)
        .select('fullname nickname email avatar allTimePoints totalTimeConnected');

      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        id: user._id.toString(), // Convert ObjectId to string for mobile app
        _id: user._id,
        fullname: user.fullname,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        allTimePoints: user.allTimePoints || 0,
        totalWifiTimeSeconds: user.totalTimeConnected || 0,
        totalWifiTimeFormatted: formatWifiTime(user.totalTimeConnected || 0)
      }));

      // Find current user's rank
      const currentUserRank = leaderboard.findIndex(user => user._id.toString() === req.user._id.toString()) + 1;

      res.json({
        leaderboard,
        userRank: currentUserRank > 0 ? currentUserRank : null,
        totalUsers: users.length,
        currentUserId: req.user._id.toString(),
        period: 'all-time'
      });
    }
  } catch (error) {
    logger.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to format WiFi time
function formatWifiTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = router; 