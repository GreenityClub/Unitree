const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

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
    const { name, fullname, nickname, university } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
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

    // Clean up existing avatars but EXCLUDE the one we just uploaded
    avatarUtils.cleanupUserAvatarsExcept(user._id, req.file.filename);

    // Update user avatar path using findByIdAndUpdate to avoid validation issues
    const avatarPath = `uploads/avatars/${req.file.filename}`;
    
    // Use findByIdAndUpdate to update only the avatar field
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { avatar: avatarPath },
      { new: true, runValidators: false } // Skip validation for this update
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
      user: updatedUser
    });
  } catch (error) {
    logger.error('Upload avatar error:', error);
    if (req.file) {
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

    // Clean up ALL avatar files for this user
    avatarUtils.cleanupUserAvatars(user._id);

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

// Get leaderboard - top users by points
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const currentUserId = req.user._id;

    // Get top users sorted by points (descending)
    const topUsers = await User.find({ role: 'student' })
      .select('name nickname points avatar email university treesPlanted')
      .sort({ points: -1 })
      .limit(limit);

    // Calculate current user's rank if not in top list
    let userRank = null;
    const currentUserInTop = topUsers.find(user => user._id.toString() === currentUserId.toString());
    
    if (!currentUserInTop) {
      // Count users with more points than current user to determine rank
      const currentUser = await User.findById(currentUserId).select('points');
      if (currentUser) {
        const usersAboveCount = await User.countDocuments({ 
          role: 'student',
          points: { $gt: currentUser.points }
        });
        userRank = usersAboveCount + 1;
      }
    } else {
      // Find rank in the top list
      userRank = topUsers.findIndex(user => user._id.toString() === currentUserId.toString()) + 1;
    }

    // Get total number of users for additional context
    const totalUsers = await User.countDocuments({ role: 'student' });

    // Format leaderboard data
    const leaderboard = topUsers.map((user, index) => ({
      id: user._id,
      name: user.name,
      nickname: user.nickname || user.name,
      points: user.points,
      avatar: user.avatar,
      email: user.email,
      university: user.university,
      treesPlanted: user.treesPlanted,
      rank: index + 1
    }));

    res.json({
      leaderboard,
      userRank,
      totalUsers,
      currentUserId: currentUserId.toString()
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 